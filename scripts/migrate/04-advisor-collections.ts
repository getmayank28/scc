// Step 4 — copy the advisor engine collections from SOURCE to TARGET:
// `cardrules`, `cardmilestones`, `cardbestofs`. All three join to cards on
// `cardSlug`, never on _id, so they line up with the slug-matched cards from
// step 3. Documents keep their source _id.
//
// Refuses to write into a non-empty target collection unless --replace is
// passed, in which case that collection is emptied first (use for a re-run).
//
// Prod's (empty) `cardbestofs` still carries indexes from the old CardAdvisor
// schema, including a UNIQUE {cardAdvisorKey, category}. Stage rows have no
// `cardAdvisorKey`, so every row would collide on null and the copy would fail
// with duplicate-key errors. Those indexes are dropped before copying.
// Reports any cardSlug that will not resolve to a card after step 3.
//
//   npx tsx --env-file=.env.migrate scripts/migrate/04-advisor-collections.ts --confirm-db=fisense-prod [--commit] [--replace]

import { COMMIT, chunk, openDbs, run } from "./_shared";

const SCRIPT = "04-advisor-collections";
const COLLECTIONS = ["cardrules", "cardmilestones", "cardbestofs"] as const;
const REPLACE = process.argv.includes("--replace");
const STALE_INDEXES: Record<string, string[]> = {
  cardbestofs: ["cardAdvisorKey_1_category_1", "cardAdvisorKey_1"],
};

run(SCRIPT, async () => {
  const { source, target, close } = await openDbs(SCRIPT, { needSource: true });

  // After step 3 the target holds every source slug plus its own prod-only ones.
  const cardSlugs = new Set([
    ...(await source!.collection("cards").distinct("slug")),
    ...(await target.collection("cards").distinct("slug")),
  ]);

  // Check every collection before writing any, so a refusal leaves nothing half-copied.
  const plan: { name: string; docs: Record<string, unknown>[]; stale: string[] }[] = [];
  for (const name of COLLECTIONS) {
    const docs = await source!.collection(name).find({}).toArray();
    const existing = await target.collection(name).countDocuments();
    const orphans = [...new Set(docs.map((d) => d.cardSlug as string))].filter(
      (s) => !cardSlugs.has(s),
    );
    console.log(
      `${name}: ${docs.length} in source, ${existing} in target` +
        (orphans.length ? ` — ${orphans.length} cardSlug(s) with no card: ${orphans.join(", ")}` : ""),
    );
    if (existing && !REPLACE) {
      throw new Error(`target ${name} already has ${existing} doc(s) — pass --replace to empty and recopy`);
    }
    const indexNames = new Set(
      (await target.collection(name).indexes().catch(() => [])).map((i) => i.name),
    );
    const stale = (STALE_INDEXES[name] ?? []).filter((n) => indexNames.has(n));
    for (const n of stale) console.log(`  drop stale index ${name}.${n}`);
    plan.push({ name, docs, stale });
  }

  if (!COMMIT) {
    await close();
    return;
  }

  for (const { name, docs, stale } of plan) {
    const col = target.collection(name);
    for (const n of stale) await col.dropIndex(n);
    if (REPLACE) await col.deleteMany({});
    for (const batch of chunk(docs, 1000)) await col.insertMany(batch, { ordered: true });
    const after = await col.countDocuments();
    if (after !== docs.length) {
      throw new Error(`${name}: expected ${docs.length} after copy, found ${after}`);
    }
    console.log(`${name}: copied ${after}`);
  }
  await close();
});
