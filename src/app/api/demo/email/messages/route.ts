import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/options";
import { ApiResponse } from "@/lib/utils/ApiResponse";
import { listAccounts, UnipileError } from "@/lib/unipile/client";
import { accountsForUser } from "@/lib/unipile/binding";
import { readStoredMessages } from "@/lib/unipile/storedReads";
import { syncMailbox, isWindowCovered } from "@/lib/unipile/sync";

export const runtime = "nodejs";

// Serves the demo mail list from OUR DB, not Unipile. The first request for a
// mailbox with no prior sync triggers a one-time full-year sync (lazy), then
// reads back from the DB. After that — and after the Unipile trial expires —
// every read is DB-only. The UI lookback (e.g. 6 months) filters the stored
// rows; we always store a full year so a later 1-year request needs no re-sync.
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?._id;
  if (!userId) return ApiResponse.error("Unauthorized", 401);

  const url = new URL(req.url);
  const explicitAccountId = url.searchParams.get("account_id") ?? "";
  const issuerSlug = url.searchParams.get("issuer") ?? "";
  const afterDays = Math.max(
    1,
    Number(url.searchParams.get("after_days") ?? "180"),
  );

  const owned = await accountsForUser(userId);
  if (owned.length === 0) return ApiResponse.error("NOT_CONNECTED", 409);

  let targets = owned;
  if (explicitAccountId) {
    const match = owned.find((a) => a.accountId === explicitAccountId);
    if (!match) {
      return ApiResponse.error("Account not connected by this user", 403);
    }
    targets = [match];
  }

  // Ensure each target is synced far enough back to cover the request. Sync is
  // one-time per mailbox; normally this is a no-op that touches no Unipile API.
  const windowStart = new Date(Date.now() - afterDays * 86_400_000);
  const syncedNow: string[] = [];
  const syncFailed: string[] = [];
  try {
    for (const account of targets) {
      if (await isWindowCovered(account.accountId, windowStart)) continue;
      const result = await syncMailbox({ ...account, userId });
      syncedNow.push(account.accountId);
      syncFailed.push(...result.failedDomains);
    }
  } catch (err) {
    console.error("[/api/demo/email/messages] sync failed:", err);
    return ApiResponse.error(
      err instanceof UnipileError
        ? err.message
        : "Could not sync mailbox from Unipile",
      502,
    );
  }

  const messages = await readStoredMessages({
    userId,
    accountIds: targets.map((a) => a.accountId),
    issuerSlug: issuerSlug || undefined,
    afterDays,
  });

  return ApiResponse.success("ok", 200, {
    source: syncedNow.length > 0 ? "synced-now" : "db",
    accounts: targets.map((a) => ({
      accountId: a.accountId,
      emailAddress: a.emailAddress ?? null,
    })),
    syncedNow,
    syncFailed,
    total: messages.length,
    withAttachments: messages.filter((m) => m.attachments.length > 0).length,
    messages,
  });
}

// Convenience for the demo page: which accounts does Unipile know about?
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?._id) return ApiResponse.error("Unauthorized", 401);
  try {
    const accounts = await listAccounts();
    return ApiResponse.success("ok", 200, accounts);
  } catch (err) {
    console.error("[/api/demo/email/messages] listAccounts failed:", err);
    return ApiResponse.error("Could not list accounts", 500);
  }
}
