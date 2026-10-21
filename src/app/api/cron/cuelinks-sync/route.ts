import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/utils/dbConnet";
import { SYNC_KEYS, touchSyncState } from "@/models/SyncState";
import { syncTransactions } from "@/lib/cuelinks/sync";

/**
 * Daily Cuelinks transaction sync, run by Vercel Cron (see vercel.json).
 * Vercel sends `Authorization: Bearer $CRON_SECRET`; anything else is refused.
 */
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  await dbConnect();
  try {
    const result = await syncTransactions();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron/cuelinks-sync] failed", err);
    // Record the failure without touching the cursor, so admin shows it and
    // the next run retries the same window.
    await touchSyncState(SYNC_KEYS.transactions, {
      lastResult: { ok: false, error: String(err) },
    });
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
