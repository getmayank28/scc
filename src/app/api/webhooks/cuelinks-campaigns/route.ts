import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/utils/dbConnet";
import AffiliateLinkCache from "@/models/AffiliateLinkCache";
import { SYNC_KEYS, touchSyncState } from "@/models/SyncState";
import { checkSecret, readParams } from "@/lib/cuelinks/webhook";
import { recheckForCampaign } from "@/lib/affiliate/health";

// The webhook must answer fast; targets it can't re-check in time are left
// due, so the next daily run takes them first.
const RECHECK_BUDGET_MS = 8_000;

/**
 * Cuelinks "Campaign Update" webhook.
 *
 * Dashboard setup: subscribe to `paused` and `live` (India), map
 * {campaign_id} → campaign_id and {update_type} → update_type, plus the same
 * constant `secret` as the transaction webhook.
 *
 * Either event changes whether a campaign's links earn, so the cached
 * conversions for that campaign are dropped and the next click re-checks with
 * Cuelinks. Without this, a paused campaign could keep receiving traffic for up
 * to the cache's 7-day TTL. The affected targets' link health is re-checked
 * too, so admin shows "stopped earning" now rather than after the next run.
 */
async function handle(req: NextRequest) {
  const params = await readParams(req);

  const secret = checkSecret(params.secret);
  if (secret === "unconfigured") {
    console.error("[webhooks/cuelinks-campaigns] CUELINKS_WEBHOOK_SECRET is not set");
    return NextResponse.json({ ok: false }, { status: 503 });
  }
  if (secret === "bad") return NextResponse.json({ ok: false }, { status: 401 });

  const campaignId = Number(params.campaign_id);
  const event = (params.update_type ?? "").toLowerCase();
  if (!Number.isFinite(campaignId) || campaignId <= 0) {
    return NextResponse.json({ ok: true, ignored: "missing campaign_id" });
  }
  if (event !== "paused" && event !== "live") {
    return NextResponse.json({ ok: true, ignored: `event ${event || "(none)"}` });
  }

  try {
    await dbConnect();
    const { deletedCount } = await AffiliateLinkCache.deleteMany({ campaignId });
    const rechecked = await recheckForCampaign(campaignId, event, Date.now() + RECHECK_BUDGET_MS);
    await touchSyncState(SYNC_KEYS.campaignWebhook, {
      lastResult: { campaignId, event, cacheRowsCleared: deletedCount, healthRechecked: rechecked },
    });
    return NextResponse.json({ ok: true, cleared: deletedCount, rechecked });
  } catch (err) {
    console.error("[webhooks/cuelinks-campaigns] failed", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
