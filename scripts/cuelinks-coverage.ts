/**
 * Cuelinks coverage report — what earns today, card by card.
 *
 * Runs the exact ladder `/api/out` runs (src/lib/cuelinks/destinations.ts) for
 * every card, portal and voucher partner, and tallies which step each one
 * lands on. Conversions go straight to the API and are memoised in-process:
 * nothing is written to the database, not even the link cache.
 *
 * Also lists the bank-card (CPL) campaigns open to us, so unmapped cards are
 * easy to spot.
 *
 *   npx tsx --env-file=.env.local scripts/cuelinks-coverage.ts
 *   npx tsx --env-file=.env.local scripts/cuelinks-coverage.ts --out=coverage.json
 */

import mongoose from "mongoose";
import { convertLink, type ConvertResult } from "../src/lib/cuelinks/client";
import { channelFor, resolveOutbound } from "../src/lib/cuelinks/destinations";
import type { Converter, Resolution } from "../src/lib/cuelinks/resolve";
import type { OutType } from "../src/lib/cuelinks/outUrl";
import Card from "../src/models/Card";
import Portal from "../src/models/Portal";
import Giftor from "../src/models/Giftor";
import { fetchIndiaCampaigns, pool } from "./cuelinks-shared";

const SUBIDS = { subid: "coverage-report" };

const memo = new Map<string, Promise<ConvertResult | null>>();
const convert: Converter = (url, channelId) => {
  if (!channelId) return Promise.resolve(null);
  const key = `${channelId}|${url}`;
  if (!memo.has(key)) memo.set(key, convertLink({ url, channelId, subids: SUBIDS }));
  return memo.get(key)!;
};

interface Row {
  type: OutType;
  id: string;
  step: Resolution["step"] | "unresolved";
  affiliated: boolean;
  campaignId: number | null;
  destination: string | null;
}

async function run(type: OutType, ids: string[]): Promise<Row[]> {
  const channelId = channelFor(type);
  return pool(ids, 8, async (id) => {
    const r = await resolveOutbound(type, id, channelId, SUBIDS, convert);
    return {
      type,
      id,
      step: r?.step ?? "unresolved",
      affiliated: r?.affiliated ?? false,
      campaignId: r?.campaignId ?? null,
      destination: r?.destination ?? null,
    };
  });
}

function tally(rows: Row[]) {
  const by: Record<string, number> = {};
  for (const r of rows) by[r.step] = (by[r.step] ?? 0) + 1;
  const earning = rows.filter((r) => r.affiliated).length;
  return { total: rows.length, earning, by };
}

async function main() {
  const out = process.argv.find((a) => a.startsWith("--out="))?.slice(6);
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log(`Database: ${mongoose.connection.db!.databaseName} (read-only)\n`);

  const campaigns = await fetchIndiaCampaigns();
  const cardCampaigns = campaigns.filter(
    (c) => c.campaign_type === "CPL" && /credit card|card cpl|card$/i.test(c.name),
  );
  console.log(`Bank card (CPL) campaigns in India: ${cardCampaigns.length}`);
  for (const c of cardCampaigns) {
    console.log(
      `  ${String(c.id).padEnd(6)} ${c.name.padEnd(36)} ${c.access_status.padEnd(12)} ₹${c.payout} ${c.payout_type}  subids:${c.sub_ids_allowed ? "yes" : "NO"}`,
    );
  }

  const [cards, portals, giftors] = await Promise.all([
    Card.find({}, "slug").lean<{ slug: string }[]>(),
    Portal.find({ status: "active" }, "slug").lean<{ slug: string }[]>(),
    Giftor.find({}, "slug").lean<{ slug: string }[]>(),
  ]);

  console.log("\nResolving (this calls the convert API once per distinct URL)…");
  const rows = [
    ...(await run("card", cards.map((c) => c.slug).filter(Boolean))),
    ...(await run("portal", portals.map((p) => p.slug).filter(Boolean))),
    ...(await run("voucher", giftors.map((g) => g.slug).filter(Boolean))),
  ];

  for (const type of ["card", "portal", "voucher"] as OutType[]) {
    const t = tally(rows.filter((r) => r.type === type));
    console.log(`\n${type.toUpperCase()}: ${t.earning}/${t.total} earn`);
    for (const [step, n] of Object.entries(t.by).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${step.padEnd(16)} ${n}`);
    }
  }

  const cardRows = rows.filter((r) => r.type === "card");
  const notEarning = cardRows.filter((r) => !r.affiliated);
  console.log(`\nCards not earning (${notEarning.length}), first 25:`);
  for (const r of notEarning.slice(0, 25)) {
    console.log(`  ${r.id.padEnd(60)} ${r.step.padEnd(10)} ${r.destination ?? ""}`);
  }

  if (out) {
    const fs = await import("fs");
    fs.writeFileSync(out, JSON.stringify({ campaigns: cardCampaigns, rows }, null, 2));
    console.log(`\nFull rows written to ${out}`);
  }
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
