// Step 2 — bring TARGET `banks` in line with SOURCE.
//
// Banks share _ids between stage and prod, so this matches on _id and $sets any
// field that differs (in practice: Standard Chartered's slug typo
// `standard0-chartered-bank`, fixed on stage by backfill-card-bank.ts). Stage
// cards' `bankId` values point at these _ids, so step 3 depends on this.
// Source banks missing from the target are inserted; target-only banks are left
// alone.
//
// Idempotent: a second run finds nothing to do.
//
//   npx tsx --env-file=.env.migrate scripts/migrate/02-banks.ts --confirm-db=fisense-prod [--commit]

import { COMMIT, openDbs, run, stableStringify } from "./_shared";

const SCRIPT = "02-banks";
const SKIP = new Set(["_id", "__v", "createdAt", "updatedAt"]);

run(SCRIPT, async () => {
  const { source, target, close } = await openDbs(SCRIPT, { needSource: true });
  const src = await source!.collection("banks").find({}).toArray();
  const tgtCol = target.collection("banks");
  const tgt = new Map(
    (await tgtCol.find({}).toArray()).map((b) => [String(b._id), b]),
  );

  let updated = 0;
  let inserted = 0;
  for (const bank of src) {
    const existing = tgt.get(String(bank._id));
    if (!existing) {
      console.log(`insert bank ${bank.name} (${bank.slug})`);
      inserted++;
      if (COMMIT) await tgtCol.insertOne(bank);
      continue;
    }
    const set: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(bank)) {
      if (SKIP.has(k)) continue;
      if (stableStringify(v) !== stableStringify(existing[k])) set[k] = v;
    }
    if (!Object.keys(set).length) continue;
    for (const k of Object.keys(set)) {
      console.log(`update bank ${bank.name}: ${k} ${JSON.stringify(existing[k])} -> ${JSON.stringify(set[k])}`);
    }
    updated++;
    if (COMMIT) await tgtCol.updateOne({ _id: existing._id }, { $set: set });
  }

  console.log(`\nbanks: ${src.length} in source, ${updated} updated, ${inserted} inserted`);
  await close();
});
