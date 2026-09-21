// One-time (lazy) sync of a mailbox's issuer mail into StoredEmail.
//
// Always pulls a FULL YEAR regardless of the UI lookback, paginating past
// Unipile's per-page limit so high-volume domains (HDFC, IndusInd) aren't
// truncated. Formats via the shared formatter and upserts. After the trial
// expires this is the data the read routes serve.

import "server-only";

import dbConnect from "@/lib/utils/dbConnet";
import StoredEmail from "@/models/StoredEmail";
import UnipileAccount from "@/models/UnipileAccount";
import { listEmails } from "./client";
import { formatEmail } from "./format";
import { allIssuerDomains } from "./issuers";

const SYNC_WINDOW_DAYS = 365;
const PAGE_SIZE = 100; // Unipile allows up to 250; 100 keeps pages responsive.
const MAX_PAGES_PER_DOMAIN = 50; // hard stop so a runaway cursor can't loop.

export interface SyncResult {
  accountId: string;
  stored: number;
  failedDomains: string[];
  syncedThroughDate: Date;
}

export async function syncMailbox(account: {
  userId: string;
  accountId: string;
  emailAddress?: string | null;
}): Promise<SyncResult> {
  await dbConnect();

  const after = new Date(
    Date.now() - SYNC_WINDOW_DAYS * 86_400_000,
  ).toISOString();
  const domains = allIssuerDomains();
  const failedDomains: string[] = [];
  let stored = 0;

  for (const domain of domains) {
    let cursor: string | undefined;
    let pages = 0;
    try {
      do {
        const res = await listEmails({
          account_id: account.accountId,
          from: domain,
          after,
          limit: PAGE_SIZE,
          cursor,
        });

        const ops = (res.items ?? []).map((email) => {
          const f = formatEmail(email);
          return {
            updateOne: {
              filter: { accountId: account.accountId, unipileId: f.unipileId },
              update: {
                $set: {
                  userId: account.userId,
                  accountId: account.accountId,
                  accountEmail: account.emailAddress ?? null,
                  ...f,
                  date: f.date ? new Date(f.date) : null,
                  readDate: f.readDate ? new Date(f.readDate) : null,
                  syncedAt: new Date(),
                },
              },
              upsert: true,
            },
          };
        });

        if (ops.length > 0) {
          const r = await StoredEmail.bulkWrite(ops, { ordered: false });
          stored += (r.upsertedCount ?? 0) + (r.modifiedCount ?? 0);
        }

        cursor = res.cursor ?? undefined;
        pages += 1;
      } while (cursor && pages < MAX_PAGES_PER_DOMAIN);
    } catch (err) {
      console.error(`[sync] ${domain} on ${account.accountId} failed:`, err);
      failedDomains.push(domain);
    }
  }

  const syncedThroughDate = new Date(after);
  await UnipileAccount.updateOne(
    { accountId: account.accountId },
    {
      $set: {
        lastSyncedAt: new Date(),
        syncedThroughDate,
        lastSyncCount: stored,
      },
    },
  );

  return { accountId: account.accountId, stored, failedDomains, syncedThroughDate };
}

/**
 * Whether a request covering `windowStart` is already served by a completed
 * sync — i.e. we synced back at least that far.
 */
export async function isWindowCovered(
  accountId: string,
  windowStart: Date,
): Promise<boolean> {
  await dbConnect();
  const acc = await UnipileAccount.findOne({ accountId }).lean();
  if (!acc?.syncedThroughDate) return false;
  // Covered when our synced-through point is at or before the requested start.
  return acc.syncedThroughDate.getTime() <= windowStart.getTime();
}
