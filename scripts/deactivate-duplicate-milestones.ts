import mongoose from "mongoose";

// One-off data fix: deactivate stale duplicate rows in `cardmilestones`.
//
// Each target is a row that duplicates a benefit already represented by another
// active row at the same card + period + spend threshold, so the advisor credits
// the same benefit twice. `computeMilestoneReturnInr` only de-duplicates
// milestones sharing a `mutual_exclusivity_group`; these rows have none, so it
// correctly sums them — the defect is in the data, not the scoring.
//
// Run: npx tsx --env-file=.env.local scripts/deactivate-duplicate-milestones.ts
// Pass --apply to write; without it the script only reports what it would do.

const TARGETS = [
  {
    key: "simplyclick-sbi-card-sbi-card__Annual Milestone Voucher__100000",
    why: "generic 'Annual Milestone Voucher' duplicating the card-specific 'Cleartrip/Yatra Voucher' at the same period + threshold",
  },
  {
    key: "simplyclick-sbi-card-sbi-card__Annual Milestone Voucher__200000",
    why: "generic 'Annual Milestone Voucher' duplicating the card-specific 'Cleartrip/Yatra Voucher' at the same period + threshold",
  },
  {
    key: "idfc-first-wow-black-credit-card--idfc-first-bank__Monthly Lounge Access__60000",
    why: "stale row: milestoneKey records a ₹60,000 threshold but spend_threshold_inr was later mutated to ₹20,000, colliding with the newer __20000 row",
  },
];

async function main() {
  const apply = process.argv.includes("--apply");
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  await mongoose.connect(uri.replace(/\/[^/?]*(\?|$)/, "/fisense-staging$1"));
  const col = mongoose.connection.db!.collection("cardmilestones");

  console.log(apply ? "MODE: apply (writing)" : "MODE: dry run (no writes)");

  for (const t of TARGETS) {
    const row = await col.findOne({ milestoneKey: t.key });
    if (!row) {
      console.log(`\nSKIP (not found)        ${t.key}`);
      continue;
    }
    if (row.is_active !== true) {
      console.log(`\nSKIP (already inactive) ${t.key}`);
      continue;
    }

    // Guard: never deactivate a row unless another active row still covers the
    // same card + period + threshold, so a benefit is never zeroed out entirely.
    const sibling = await col.findOne({
      cardSlug: row.cardSlug,
      is_active: true,
      milestoneKey: { $ne: t.key },
      milestone_period: row.milestone_period,
      spend_threshold_inr: row.spend_threshold_inr,
    });
    if (!sibling) {
      console.log(`\nABORT (no surviving sibling) ${t.key}`);
      continue;
    }

    console.log(`\n${apply ? "DEACTIVATING" : "WOULD DEACTIVATE"} ${t.key}`);
    console.log(`   reason : ${t.why}`);
    console.log(
      `   drops  : "${row.milestone_type}" ₹${row.benefit_value_inr} ${row.milestone_period} @₹${row.spend_threshold_inr}`,
    );
    console.log(
      `   keeps  : "${sibling.milestone_type}" ₹${sibling.benefit_value_inr}`,
    );

    if (apply) {
      const res = await col.updateOne(
        { milestoneKey: t.key },
        { $set: { is_active: false, updatedAt: new Date() } },
      );
      console.log(`   write  : modified=${res.modifiedCount}`);
    }
  }

  console.log("\n--- current state ---");
  const slugs = [...new Set(TARGETS.map((t) => t.key.split("__")[0]))];
  for (const slug of slugs) {
    const card = await mongoose.connection
      .db!.collection("cards")
      .findOne({ slug });
    console.log(`\n${card?.name ?? slug}`);
    const rows = await col
      .find({ cardSlug: slug })
      .sort({ spend_threshold_inr: 1 })
      .toArray();
    for (const m of rows) {
      const occ = { monthly: 12, quarterly: 4, annually: 1 }[
        m.milestone_period as string
      ];
      const annual = occ ? ` -> ₹${m.benefit_value_inr * occ}/yr` : "";
      console.log(
        `   ${m.is_active ? "ACTIVE " : "off    "} "${m.milestone_type}" ₹${m.benefit_value_inr} ${m.milestone_period} @₹${m.spend_threshold_inr}${m.is_active ? annual : ""}`,
      );
    }
  }

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
