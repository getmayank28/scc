// Step 1 — prepare the TARGET `cards` collection for the slug-keyed copy.
//
//   a. Duplicate slugs. Prod holds two copies each of a couple of cards. They
//      block the unique `slug` index the new Card model declares, and make the
//      slug match in step 3 ambiguous. Keep the NEWEST copy (by _id time), delete
//      the rest — but only if no usercard points at a copy being deleted;
//      otherwise abort and leave it for a human.
//   b. Renamed slugs. Three cards exist in prod and stage under different slugs
//      (listed in scripts/data/prod-only-cards.json as `renamedToStageSlug`).
//      Rewrite the prod slug to the stage slug, keeping the prod _id, so step 3
//      updates that card instead of inserting a second copy.
//
// Idempotent: a second run finds nothing to do.
//
//   npx tsx --env-file=.env.migrate scripts/migrate/01-prod-card-fixes.ts --confirm-db=fisense-prod [--commit]

import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { COMMIT, openDbs, run } from "./_shared";

const SCRIPT = "01-prod-card-fixes";

interface ProdOnlyFile {
  cards: { slug: string; renamedToStageSlug?: string }[];
}

run(SCRIPT, async () => {
  const { target, close } = await openDbs(SCRIPT, { needSource: false });
  const cards = target.collection("cards");
  const usercards = target.collection("usercards");

  // --- a. duplicate slugs ---
  const dupes = await cards
    .aggregate<{ _id: string; ids: mongoose.Types.ObjectId[] }>([
      { $group: { _id: "$slug", ids: { $push: "$_id" }, n: { $sum: 1 } } },
      { $match: { n: { $gt: 1 } } },
    ])
    .toArray();

  if (!dupes.length) console.log("duplicate slugs: none");
  for (const d of dupes) {
    const sorted = [...d.ids].sort(
      (a, b) => b.getTimestamp().getTime() - a.getTimestamp().getTime(),
    );
    const [keep, ...drop] = sorted;
    const held = await usercards.countDocuments({ cardId: { $in: drop } });
    if (held) {
      throw new Error(
        `slug "${d._id}": ${held} usercard(s) reference a copy that would be deleted — resolve by hand`,
      );
    }
    console.log(
      `duplicate slug "${d._id}": keep ${keep} (${keep.getTimestamp().toISOString().slice(0, 10)}), delete ${drop.join(", ")}`,
    );
    if (COMMIT) await cards.deleteMany({ _id: { $in: drop } });
  }

  // --- b. renamed slugs ---
  const file = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../data/prod-only-cards.json"), "utf8"),
  ) as ProdOnlyFile;
  const renames = file.cards.filter((c) => c.renamedToStageSlug);

  for (const { slug: from, renamedToStageSlug: to } of renames) {
    const [fromDoc, toDoc] = await Promise.all([
      cards.findOne({ slug: from }, { projection: { _id: 1 } }),
      cards.findOne({ slug: to }, { projection: { _id: 1 } }),
    ]);
    if (!fromDoc && toDoc) {
      console.log(`rename "${from}" -> "${to}": already done`);
      continue;
    }
    if (!fromDoc) throw new Error(`rename: "${from}" not found in target`);
    if (toDoc) throw new Error(`rename: "${to}" already exists in target — would duplicate`);
    console.log(`rename "${from}" -> "${to}" (_id ${fromDoc._id} kept)`);
    if (COMMIT) await cards.updateOne({ _id: fromDoc._id }, { $set: { slug: to } });
  }

  await close();
});
