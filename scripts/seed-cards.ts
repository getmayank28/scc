// Inject the in-memory MOCK_CARDS into the CardDoc collection (CardAdvisor
// model). Idempotent — upserts existing docs by their stable string id
// (slug, matches MockCard._id). Unlike seed-advisor, this only touches
// cards; it does not write rules or recompute bestOf payloads.
//
// Usage:
//   npx tsx --env-file=.env.local scripts/seed-cards.ts
//   npx tsx --env-file=.env.local scripts/seed-cards.ts --dry-run
//   npx tsx --env-file=.env.local scripts/seed-cards.ts --wipe   (clears cards first)
//
// Reads MONGODB_URI from .env.local via tsx's --env-file flag.

import mongoose from "mongoose";
import dbConnect from "../src/lib/utils/dbConnet";
import CardAdvisorModel from "../src/models/Card";
import { MOCK_CARDS } from "../src/lib/logic/advisor/cards";

function readFlag(name: string): boolean {
  return process.argv.includes(name);
}

async function main() {
  const dryRun = readFlag("--dry-run");
  const wipe = readFlag("--wipe");

  console.log(`[seed-cards] starting ${dryRun ? "(dry-run)" : ""}`);
  console.log(`[seed-cards] cards=${MOCK_CARDS.length}`);

  await dbConnect();

  if (wipe && !dryRun) {
    console.log("[seed-cards] --wipe: clearing advisor card rows");
    await CardAdvisorModel.deleteMany({});
  }

  console.log("[seed-cards] upserting CardDoc docs...");
  let cardCount = 0;
  for (const mc of MOCK_CARDS) {
    if (dryRun) {
      cardCount++;
      continue;
    }
    await CardAdvisorModel.updateOne(
      { slug: mc._id },
      {
        $set: {
          name: mc.name,
          slug: mc.slug,
          bankName: mc.bankId,
          network: mc.network,
          eligibility: mc.eligibility,
          fees: mc.fees,
          forex_markup_percentage: mc.forex_markup_percentage,
          rewards: mc.rewards,
          categories: mc.categories,
          welcome_benefit: mc.welcome_benefit,
          lounge: mc.lounge,
          ideal_for: mc.ideal_for,
          not_ideal_for: mc.not_ideal_for,
          is_active: mc.is_active,
          excluded_categories: mc.excluded_categories ?? [],
        },
        $setOnInsert: { rulesVersion: 1 },
      },
      { upsert: true },
    );
    cardCount++;
  }
  console.log(`[seed-cards] CardDoc upserts: ${cardCount}`);

  await mongoose.disconnect();
  console.log("[seed-cards] done");
}

main().catch((err) => {
  console.error("[seed-cards] failed:", err);
  process.exit(1);
});
