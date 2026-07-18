// Seed the advisor collections (CardAdvisor, CardRule, CardBestOf) from the
// in-memory MOCK_CARDS / MOCK_RULES. Idempotent — re-running upserts existing
// docs by their stable string ids (slug / ruleKey).
//
// Usage:
//   npm run seed:advisor
//   npm run seed:advisor -- --dry-run
//   npm run seed:advisor -- --wipe        (clears collections first)
//
// Reads MONGODB_URI from .env.local via tsx's --env-file flag.

import mongoose from "mongoose";
import dbConnect from "../src/lib/utils/dbConnet";
import CardAdvisorModel from "../src/models/Card";
import CardRuleModel from "../src/models/CardRule";
import { MOCK_CARDS } from "../src/lib/logic/advisor/cards";
import { MOCK_RULES, validateSharedCapGroups } from "../src/lib/logic/advisor/rules";
import { recomputeBestOfForCard } from "../src/lib/advisor/recompute";

// Fail-fast: catch malformed shared-cap groups before any writes go to Atlas.
// Used to run at bestOf.ts module-load — moved here as part of removing the
// last runtime dependency on MOCK_RULES.
validateSharedCapGroups(MOCK_RULES);

function readFlag(name: string): boolean {
  return process.argv.includes(name);
}

async function main() {
  const dryRun = readFlag("--dry-run");
  const wipe = readFlag("--wipe");

  console.log(`[seed-advisor] starting ${dryRun ? "(dry-run)" : ""}`);
  console.log(
    `[seed-advisor] cards=${MOCK_CARDS.length} rules=${MOCK_RULES.length}`,
  );

  await dbConnect();

  if (wipe && !dryRun) {
    console.log(
      "[seed-advisor] --wipe: clearing CardAdvisor / CardRule / CardBestOf",
    );
    await Promise.all([
      CardAdvisorModel.deleteMany({}),
      CardRuleModel.deleteMany({}),
      mongoose.connection
        .collection("cardbestofs")
        .deleteMany({})
        .catch(() => {}),
    ]);
  }

  // 1. Upsert CardAdvisor docs.
  console.log("[seed-advisor] upserting CardAdvisor docs...");
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
  console.log(`[seed-advisor] CardAdvisor upserts: ${cardCount}`);

  // 2. Upsert CardRule docs.
  console.log("[seed-advisor] upserting CardRule docs...");
  let ruleCount = 0;
  for (const mr of MOCK_RULES) {
    if (dryRun) {
      ruleCount++;
      continue;
    }
    await CardRuleModel.updateOne(
      { ruleKey: mr._id },
      {
        $set: {
          ruleKey: mr._id,
          cardSlug: mr.cardId,
          category: mr.category,
          merchant: mr.merchant,
          reward: mr.reward,
          caps: mr.caps,
          shared_cap_group: mr.shared_cap_group,
          valid_from: mr.valid_from,
          valid_until: mr.valid_until,
          is_active: mr.is_active,
        },
      },
      { upsert: true },
    );
    ruleCount++;
  }
  console.log(`[seed-advisor] CardRule upserts: ${ruleCount}`);

  // 3. Recompute bestOf for every card.
  console.log("[seed-advisor] recomputing bestOf payloads...");
  let bestOfRows = 0;
  for (const mc of MOCK_CARDS) {
    if (dryRun) continue;
    const { written } = await recomputeBestOfForCard(mc._id);
    bestOfRows += written;
  }
  console.log(`[seed-advisor] CardBestOf rows written: ${bestOfRows}`);

  await mongoose.disconnect();
  console.log("[seed-advisor] done");
}

main().catch((err) => {
  console.error("[seed-advisor] failed:", err);
  process.exit(1);
});
