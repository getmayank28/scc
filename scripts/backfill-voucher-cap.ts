// One-off backfill: fold the deprecated caps.voucher_monthly_purchase_limit_inr
// into caps.voucher_cap ({ period: monthly, metric: purchase_inr }) on every
// CardRule where voucher_cap is not already set. The legacy field is left in
// place (read-time normalization in toRuleCaps makes it inert once voucher_cap
// exists). Idempotent: re-running matches nothing.
//
// Usage:
//   npx tsx --env-file=.env.local scripts/backfill-voucher-cap.ts
//   npx tsx --env-file=.env.local scripts/backfill-voucher-cap.ts --dry-run
//
// Run `npm run bestof:recompute` afterwards so payloads pick up the new shape.

import mongoose from "mongoose";
import dbConnect from "../src/lib/utils/dbConnet";
import CardRuleModel from "../src/models/CardRule";

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  await dbConnect();

  const filter = {
    "caps.voucher_monthly_purchase_limit_inr": { $ne: null },
    $or: [
      { "caps.voucher_cap": null },
      { "caps.voucher_cap": { $exists: false } },
    ],
  };

  const docs = await CardRuleModel.find(filter)
    .select("ruleKey caps")
    .lean<{ ruleKey: string; caps: { voucher_monthly_purchase_limit_inr: number } }[]>();

  console.log(
    `[backfill-voucher-cap] ${docs.length} rule(s) with a legacy limit and no voucher_cap` +
      (dryRun ? " (dry run, not writing)" : ""),
  );

  if (!dryRun && docs.length > 0) {
    const res = await CardRuleModel.bulkWrite(
      docs.map((d) => ({
        updateOne: {
          filter: { ruleKey: d.ruleKey },
          update: {
            $set: {
              "caps.voucher_cap": {
                period: "monthly",
                metric: "purchase_inr",
                value: d.caps.voucher_monthly_purchase_limit_inr,
                scope: "merchant",
              },
            },
          },
        },
      })),
    );
    console.log(`[backfill-voucher-cap] modified ${res.modifiedCount} rule(s)`);
  }
  for (const d of docs) {
    console.log(`  ${d.ruleKey}  limit=${d.caps.voucher_monthly_purchase_limit_inr}`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("[backfill-voucher-cap] fatal:", err);
  process.exit(1);
});
