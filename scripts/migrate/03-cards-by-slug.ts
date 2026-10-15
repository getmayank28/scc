// Step 3 — copy SOURCE card data onto TARGET `cards`, matched by `slug`.
//
// Prod and stage card _ids never match (stage's `cards` was rebuilt wholesale),
// and prod `usercards.cardId` points at prod _ids. So this NEVER replaces a
// document or changes an _id:
//
//   - slug in both      -> $set every source field except _id/__v/createdAt onto
//                          the prod doc. Prod _id kept; wallets stay linked.
//   - slug only in source -> insert the source doc as-is (no user holds it).
//   - slug only in target -> untouched (see scripts/data/prod-only-cards.json).
//
// Fields present on a prod doc but absent from its stage counterpart are only
// reported. Pass --unset-extra to remove them as well.
//
// Preconditions (checked): step 1 done (no duplicate slugs in target) and step 2
// done (every source bankId exists in target banks).
//
// Idempotent: a second run reports 0 changed.
//
//   npx tsx --env-file=.env.migrate scripts/migrate/03-cards-by-slug.ts --confirm-db=fisense-prod [--commit] [--unset-extra]

import mongoose from "mongoose";
import { COMMIT, chunk, openDbs, run, stableStringify } from "./_shared";

const SCRIPT = "03-cards-by-slug";
const KEEP_TARGET = new Set(["_id", "__v", "createdAt"]);
const UNSET_EXTRA = process.argv.includes("--unset-extra");

run(SCRIPT, async () => {
  const { source, target, close } = await openDbs(SCRIPT, { needSource: true });
  const src = await source!.collection("cards").find({}).toArray();
  const tgtCol = target.collection("cards");
  const tgt = await tgtCol.find({}).toArray();

  // Preconditions.
  const bySlug = new Map<string, (typeof tgt)[number]>();
  for (const c of tgt) {
    if (bySlug.has(c.slug)) {
      throw new Error(`duplicate slug "${c.slug}" in target — run 01-prod-card-fixes first`);
    }
    bySlug.set(c.slug, c);
  }
  const bankIds = new Set(
    (await target.collection("banks").find({}, { projection: { _id: 1 } }).toArray()).map(
      (b) => String(b._id),
    ),
  );
  const missingBanks = src.filter((c) => c.bankId && !bankIds.has(String(c.bankId)));
  if (missingBanks.length) {
    throw new Error(
      `${missingBanks.length} source card(s) reference a bankId missing from target banks — run 02-banks first`,
    );
  }
  const tgtIds = new Set(tgt.map((c) => String(c._id)));

  const ops: mongoose.mongo.AnyBulkWriteOperation[] = [];
  const extraFields = new Map<string, number>();
  let unchanged = 0;
  let updated = 0;
  let inserted = 0;

  for (const card of src) {
    const existing = bySlug.get(card.slug);
    if (!existing) {
      if (tgtIds.has(String(card._id))) {
        throw new Error(`source _id ${card._id} (${card.slug}) already used by another target card`);
      }
      inserted++;
      ops.push({ insertOne: { document: card } });
      continue;
    }

    const set: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(card)) {
      if (KEEP_TARGET.has(k)) continue;
      if (stableStringify(v) !== stableStringify(existing[k])) set[k] = v;
    }
    const extra = Object.keys(existing).filter((k) => !KEEP_TARGET.has(k) && !(k in card));
    for (const k of extra) extraFields.set(k, (extraFields.get(k) ?? 0) + 1);

    const unset = UNSET_EXTRA ? Object.fromEntries(extra.map((k) => [k, ""])) : {};
    if (!Object.keys(set).length && !Object.keys(unset).length) {
      unchanged++;
      continue;
    }
    updated++;
    ops.push({
      updateOne: {
        filter: { _id: existing._id },
        update: { ...(Object.keys(set).length ? { $set: set } : {}), ...(Object.keys(unset).length ? { $unset: unset } : {}) },
      },
    });
  }

  const srcSlugs = new Set(src.map((c) => c.slug));
  const targetOnly = tgt.filter((c) => !srcSlugs.has(c.slug)).length;

  console.log(`source cards:        ${src.length}`);
  console.log(`  update in place:   ${updated}  (prod _id kept)`);
  console.log(`  already identical: ${unchanged}`);
  console.log(`  insert new:        ${inserted}`);
  console.log(`target-only, untouched: ${targetOnly}`);
  if (extraFields.size) {
    console.log(
      `\nfields on prod docs that stage lacks (${UNSET_EXTRA ? "WILL BE UNSET" : "kept; --unset-extra removes"}):`,
    );
    for (const [k, n] of extraFields) console.log(`  ${k}: ${n} card(s)`);
  }

  if (COMMIT && ops.length) {
    for (const batch of chunk(ops, 500)) await tgtCol.bulkWrite(batch, { ordered: true });
    console.log(`\nwrote ${ops.length} operation(s)`);
  }
  await close();
});
