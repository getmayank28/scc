// Persistent user↔Unipile-account binding, backed by the UnipileAccount model.
//
// Replaces the in-memory demoStore. Because it is DB-backed, bindings survive
// restarts and are shared across serverless instances — which is what makes the
// "fetch the user's own connected account" flow safe in production.

import "server-only";

import dbConnect from "@/lib/utils/dbConnet";
import UnipileAccount from "@/models/UnipileAccount";

/** Called by the hosted-auth callback once Unipile confirms a connection. */
export async function bindAccount(params: {
  userId: string;
  accountId: string;
  provider?: string;
  emailAddress?: string;
}): Promise<void> {
  await dbConnect();
  await UnipileAccount.findOneAndUpdate(
    { accountId: params.accountId },
    {
      $set: {
        userId: params.userId,
        provider: params.provider,
        emailAddress: params.emailAddress,
        status: "connected",
        connectedAt: new Date(),
      },
    },
    { upsert: true, new: true },
  );
}

/** The user's connected accounts, most-recent first. */
export async function accountsForUser(
  userId: string,
): Promise<Array<{ accountId: string; emailAddress?: string; provider?: string }>> {
  await dbConnect();
  const rows = await UnipileAccount.find({
    userId,
    status: "connected",
  })
    .sort({ connectedAt: -1 })
    .lean();
  return rows.map((r) => ({
    accountId: r.accountId,
    emailAddress: r.emailAddress,
    provider: r.provider,
  }));
}

/** Whether this specific account belongs to this user. */
export async function ownsAccount(
  accountId: string,
  userId: string,
): Promise<boolean> {
  await dbConnect();
  const row = await UnipileAccount.findOne({
    accountId,
    userId,
    status: "connected",
  }).lean();
  return !!row;
}

/**
 * Resolve the account to read for this user: an explicit id (ownership-checked)
 * or their single connected account. Returns null when nothing is connected, so
 * the route can prompt the user to connect.
 */
export async function resolveAccountForUser(
  userId: string,
  explicitAccountId?: string,
): Promise<{ accountId: string } | { error: "not-connected" | "forbidden" }> {
  if (explicitAccountId) {
    return (await ownsAccount(explicitAccountId, userId))
      ? { accountId: explicitAccountId }
      : { error: "forbidden" };
  }
  const owned = await accountsForUser(userId);
  if (owned.length === 0) return { error: "not-connected" };
  return { accountId: owned[0].accountId };
}
