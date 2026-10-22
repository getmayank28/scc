import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/utils/dbConnet";
import { SYNC_KEYS, touchSyncState } from "@/models/SyncState";
import { syncTransactions } from "@/lib/cuelinks/sync";
import { refreshOffers } from "@/lib/cuelinks/offers";

/**
 * Daily Cuelinks jobs, run by Vercel Cron (see vercel.json): the transaction
 * sync, then the live-offers refresh. One cron entry for both because the
 * Hobby plan limits how many cron jobs a project can have. The two are
 * independent — one failing doesn't skip the other.
 * Vercel sends `Authorization: Bearer $CRON_SECRET`; anything else is refused.
 */
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

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

  return NextResponse.json({ ok, transactions, offers }, { status: ok ? 200 : 500 });
}
