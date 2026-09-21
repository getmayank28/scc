import { ApiResponse } from "@/lib/utils/ApiResponse";
import { bindAccount } from "@/lib/unipile/binding";
import { getAccount, accountEmail } from "@/lib/unipile/client";
import type { UnipileNotifyPayload } from "@/lib/unipile/types";

export const runtime = "nodejs";

// Unipile POSTs here when a hosted-auth flow finishes. Public by necessity
// (Unipile carries no session), so it is guarded by a shared secret passed as
// ?secret= on the notify_url when UNIPILE_WEBHOOK_SECRET is set.
export async function POST(req: Request) {
  const expected = process.env.UNIPILE_WEBHOOK_SECRET;
  if (expected) {
    const provided = new URL(req.url).searchParams.get("secret");
    if (provided !== expected) return ApiResponse.error("Forbidden", 403);
  }

  let body: UnipileNotifyPayload;
  try {
    body = (await req.json()) as UnipileNotifyPayload;
  } catch {
    return ApiResponse.error("Invalid JSON body", 400);
  }

  const { account_id: accountId, name: userId, status } = body;
  if (!accountId || !userId) {
    return ApiResponse.error("Missing account_id or name", 400);
  }

  // Capture the connected mailbox address for display. Best-effort: a failure
  // here must not drop the binding, so we still bind without the email.
  let emailAddress: string | undefined;
  let provider: string | undefined;
  try {
    const account = await getAccount(accountId);
    emailAddress = accountEmail(account);
    provider = account.type;
  } catch (err) {
    console.warn("[/api/demo/email/callback] getAccount failed:", err);
  }

  // `name` is the user _id we set when creating the hosted-auth link.
  await bindAccount({ userId, accountId, provider, emailAddress });
  console.log(
    `[/api/demo/email/callback] ${status} account=${accountId} user=${userId} email=${emailAddress ?? "?"}`,
  );

  return ApiResponse.success("ok", 200, { accountId });
}
