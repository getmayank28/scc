import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/utils/dbConnet";
import { SYNC_KEYS, touchSyncState } from "@/models/SyncState";
import { fromWebhook, upsertTransaction } from "@/lib/cuelinks/transactions";
import { checkSecret, readParams } from "@/lib/cuelinks/webhook";

/**
 * Cuelinks "Transaction Update" webhook (Global Postback).
 *
 * Dashboard setup: subscribe to every status, and map each macro to a
 * parameter of the same name — transaction_id, status, campaign_id,
 * campaign_name, sale_amount, user_commission, currency,
 * transaction_reference_id, transaction_date, aff_sub, subid2 … subid5 — plus
 * a constant `secret` equal to CUELINKS_WEBHOOK_SECRET. {ip_address} is
 * deliberately not mapped.
 *
 * Must answer 2xx fast: Cuelinks disables the webhook after 10 consecutive
 * failures. Payloads we can't use are acknowledged with 200 and logged, so a
 * bad sample can't knock the webhook out; only a wrong secret is refused.
 */
async function handle(req: NextRequest) {
  const params = await readParams(req);

  const secret = checkSecret(params.secret);
  if (secret === "unconfigured") {
    console.error("[webhooks/cuelinks] CUELINKS_WEBHOOK_SECRET is not set");
    return NextResponse.json({ ok: false }, { status: 503 });
  }
  if (secret === "bad") return NextResponse.json({ ok: false }, { status: 401 });

  const input = fromWebhook(params);
  if (!input) {
    console.warn("[webhooks/cuelinks] unusable payload", {
      transaction_id: params.transaction_id,
      status: params.status,
    });
    return NextResponse.json({ ok: true, ignored: "missing transaction_id or unknown status" });
  }

  try {
    await dbConnect();
    const outcome = await upsertTransaction(input, "webhook");
    await touchSyncState(SYNC_KEYS.txnWebhook, {
      lastResult: { transactionId: input.cuelinksId, status: input.status, outcome },
    });
    return NextResponse.json({ ok: true, outcome });
  } catch (err) {
    // A 5xx makes Cuelinks retry with backoff, which is what we want here.
    console.error("[webhooks/cuelinks] upsert failed", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
