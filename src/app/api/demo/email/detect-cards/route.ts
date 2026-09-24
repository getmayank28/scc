import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/options";
import { ApiResponse } from "@/lib/utils/ApiResponse";
import { accountsForUser } from "@/lib/unipile/binding";
import dbConnect from "@/lib/utils/dbConnet";
import StoredEmail, { type IStoredEmail } from "@/models/StoredEmail";
import { loadCatalog } from "@/lib/carddetect/catalog";
import { detectCards } from "@/lib/carddetect/detect";
import type { EmailLike } from "@/lib/carddetect/signals";

export const runtime = "nodejs";

// "Find my cards": run the two-pass detector over the user's already-synced
// mail and return the verdict table. Read-only — nothing is written to the
// user's wallet here; adding a card stays an explicit, separate action.
//
// Reads exclusively from StoredEmail, so this costs no Unipile calls and keeps
// working after the trial expires. If a mailbox has never been synced the list
// is simply empty, and the UI points the user at "Fetch issuer mail" first.
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?._id;
  if (!userId) return ApiResponse.error("Unauthorized", 401);

  const url = new URL(req.url);
  const explicitAccountId = url.searchParams.get("account_id") ?? "";
  // Detection needs the full history: liveness bands run to 365 days and a
  // STALE verdict is only trustworthy if we actually looked that far back.
  // Number("abc") is NaN and Math.max(1, NaN) is NaN, which would make `since`
  // an Invalid Date and throw a CastError inside the Mongo query.
  const requestedLookback = Number(url.searchParams.get("lookback_days") ?? "400");
  const lookbackDays = Number.isFinite(requestedLookback)
    ? Math.min(3650, Math.max(1, requestedLookback))
    : 400;

  const owned = await accountsForUser(userId);
  if (owned.length === 0) return ApiResponse.error("NOT_CONNECTED", 409);

  let targets = owned;
  if (explicitAccountId) {
    const match = owned.find((a) => a.accountId === explicitAccountId);
    if (!match) return ApiResponse.error("Account not connected by this user", 403);
    targets = [match];
  }

  await dbConnect();
  const since = new Date(Date.now() - lookbackDays * 86_400_000);
  const rows = (await StoredEmail.find({
    userId,
    accountId: { $in: targets.map((a) => a.accountId) },
    issuer: { $ne: null },
    date: { $gte: since },
  })
    .select({
      unipileId: 1,
      issuer: 1,
      subject: 1,
      bodyPlain: 1,
      fromEmail: 1,
      date: 1,
      hasAttachments: 1,
    })
    .lean()) as unknown as IStoredEmail[];

  const emails: EmailLike[] = rows.map((r) => ({
    id: r.unipileId,
    issuer: r.issuer,
    subject: r.subject ?? "",
    bodyPlain: r.bodyPlain ?? "",
    fromEmail: r.fromEmail ?? "",
    date: r.date ?? null,
    hasAttachments: Boolean(r.hasAttachments),
  }));

  const catalog = await loadCatalog();
  const summary = detectCards(emails, catalog);

  return ApiResponse.success("ok", 200, {
    ...summary,
    accounts: targets.map((a) => ({
      accountId: a.accountId,
      emailAddress: a.emailAddress ?? null,
    })),
    lookbackDays,
  });
}
