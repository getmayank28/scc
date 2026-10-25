import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/utils/dbConnet";
import { SYNC_KEYS, touchSyncState } from "@/models/SyncState";
import { syncTransactions } from "@/lib/cuelinks/sync";
import { refreshOffers } from "@/lib/cuelinks/offers";
import { runHealthCheck } from "@/lib/affiliate/health";

/**
 * Daily Cuelinks jobs, run by Vercel Cron (see vercel.json): the transaction
 * sync, the live-offers refresh, then the link-health check with whatever time
 * is left. One cron entry for all three because the Hobby plan limits how many
 * cron jobs a project can have. They're independent — one failing doesn't skip
 * the others — and the health check resumes on the next run if time runs out.
 * Vercel sends `Authorization: Bearer $CRON_SECRET`; anything else is refused.
 */
export const maxDuration = 60;

// Leave headroom under maxDuration for the final writes and the response.
const HEALTH_DEADLINE_MS = 50_000;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const startedAt = Date.now();
  await dbConnect();

  let transactions: unknown = null;
  let offers: unknown = null;
  let ok = true;

  try {
    transactions = await syncTransactions();
  } catch (err) {
    ok = false;
    console.error("[cron/cuelinks-sync] transactions failed", err);
    // Record the failure without touching the cursor, so admin shows it and
    // the next run retries the same window.
    await touchSyncState(SYNC_KEYS.transactions, {
      lastResult: { ok: false, error: String(err) },
    });
  }

  try {
    offers = await refreshOffers();
  } catch (err) {
    ok = false;
    console.error("[cron/cuelinks-sync] offers failed", err);
    await touchSyncState(SYNC_KEYS.offers, { lastResult: { ok: false, error: String(err) } });
  }

  let health: unknown = null;
  try {
    health = await runHealthCheck({ deadline: startedAt + HEALTH_DEADLINE_MS });
    await touchSyncState(SYNC_KEYS.linkHealth, { lastResult: { ...(health as object), ok: true } });
  } catch (err) {
    ok = false;
    console.error("[cron/cuelinks-sync] link health failed", err);
    await touchSyncState(SYNC_KEYS.linkHealth, { lastResult: { ok: false, error: String(err) } });
  }

  return NextResponse.json({ ok, transactions, offers, health }, { status: ok ? 200 : 500 });
}
