// Step 5 — create the indexes the new models declare, on TARGET, explicitly.
//
// Mongoose would otherwise build them on the first app boot, where a failure
// (e.g. duplicate slugs blocking the unique `cards.slug` index) is only a log
// line. Here every unique index is preflighted for duplicates first.
//
// Uses createIndexes (add-only). Never syncIndexes, which would DROP any prod
// index the schema does not declare.
//
//   npx tsx --env-file=.env.migrate scripts/migrate/05-indexes.ts --confirm-db=fisense-prod [--commit]

import type { Schema } from "mongoose";
import BankModel from "../../src/models/Bank";
import CardModel from "../../src/models/Card";
import CardBestOfModel from "../../src/models/CardBestOf";
import CardMilestoneModel from "../../src/models/CardMilestone";
import CardRuleModel from "../../src/models/CardRule";
import { COMMIT, openDbs, run } from "./_shared";

const SCRIPT = "05-indexes";
const MODELS = [BankModel, CardModel, CardRuleModel, CardMilestoneModel, CardBestOfModel];

type IndexSpec = [Record<string, 1 | -1>, { unique?: boolean }];

run(SCRIPT, async () => {
  const { target, targetConn, close } = await openDbs(SCRIPT, { needSource: false });
  let problems = 0;

  for (const Model of MODELS) {
    const name = Model.collection.collectionName;
    const col = target.collection(name);
    const existing = await col.indexes().catch(() => []);
    const have = new Set(existing.map((i) => JSON.stringify(i.key) + (i.unique ? "!u" : "")));
    const want = (Model.schema as Schema).indexes() as IndexSpec[];

    const missing = want.filter(([key, opts]) => !have.has(JSON.stringify(key) + (opts.unique ? "!u" : "")));
    console.log(`${name}: ${existing.length} existing, ${want.length} declared, ${missing.length} to create`);

    for (const [key, opts] of missing) {
      let note = "";
      if (opts.unique) {
        const groupId = Object.fromEntries(Object.keys(key).map((k) => [k.replace(/\./g, "_"), `$${k}`]));
        const dupes = await col
          .aggregate([{ $group: { _id: groupId, n: { $sum: 1 } } }, { $match: { n: { $gt: 1 } } }, { $limit: 5 }])
          .toArray();
        if (dupes.length) {
          problems++;
          note = `  BLOCKED — duplicates: ${dupes.map((d) => JSON.stringify(d._id)).join(", ")}`;
        }
      }
      console.log(`  + ${JSON.stringify(key)}${opts.unique ? " unique" : ""}${note}`);
    }
  }

  if (problems) throw new Error(`${problems} unique index(es) blocked by duplicates — fix data first`);

  if (COMMIT) {
    for (const Model of MODELS) {
      const bound = targetConn.model(Model.modelName, Model.schema, Model.collection.collectionName);
      await bound.createIndexes();
      console.log(`${Model.collection.collectionName}: indexes ensured`);
    }
  }
  await close();
});
