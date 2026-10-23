import SyncState, { SYNC_KEYS, touchSyncState } from "@/models/SyncState";
import { listTransactions } from "./client";
import { fromApi, upsertTransaction, type UpsertOutcome } from "./transactions";

/**
 * Pulls every transaction Cuelinks changed since the last run and upserts it.
 * The source of truth behind the webhook: it catches deliveries the webhook
 * missed and validations that land days later.
 *
 * Callers must have connected (`dbConnect`). On failure it throws without
 * moving the cursor, so the next run re-reads the same window.
 */

const FIRST_RUN_LOOKBACK_MS = 90 * 24 * 60 * 60 * 1000;
// Re-read the last hour each run: a change made while we were paging may not
// be visible yet. Upserts are idempotent, so the overlap is free.
const OVERLAP_MS = 60 * 60 * 1000;
const MAX_PAGES = 100;

export interface SyncResult {
  from: string;
  pages: number;
  created: number;
  updated: number;
  ignored: number;
  skipped: number;
}

export async function syncTransactions(opts: { since?: Date } = {}): Promise<SyncResult> {
  const startedAt = new Date();
  const state = await SyncState.findOne({ key: SYNC_KEYS.transactions }).lean();
  const from =
    opts.since ?? state?.cursor ?? new Date(startedAt.getTime() - FIRST_RUN_LOOKBACK_MS);

  const counts: Record<UpsertOutcome | "skipped", number> = {
    created: 0,
    updated: 0,
    ignored: 0,
    skipped: 0,
  };
  let page: number | null = 1;
  let pages = 0;
  while (page && pages < MAX_PAGES) {
    const { data, nextPage } = await listTransactions(from, page);
    pages++;
    for (const row of data) {
      const input = fromApi(row);
      if (!input) {
        counts.skipped++;
        continue;
      }
      counts[await upsertTransaction(input, "sync")]++;
    }
    page = nextPage;
  }

  const result: SyncResult = { from: from.toISOString(), pages, ...counts };
  await touchSyncState(SYNC_KEYS.transactions, {
    cursor: new Date(startedAt.getTime() - OVERLAP_MS),
    lastResult: { ...result, ok: true },
  });
  return result;
}
