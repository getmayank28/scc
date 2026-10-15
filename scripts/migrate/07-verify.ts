// Step 7 — read-only post-migration checks, SOURCE vs TARGET. Writes nothing.
// Exits non-zero if any hard check fails.
//
// Hard checks:
//   - no duplicate card slugs in target; every source slug present in target
//   - no usercard newly dangling (only the known pre-migration ones allowed)
//   - cardrules / cardmilestones counts equal source
//   - no bestof row whose rulesVersion disagrees with its card
//   - the unique indexes the app relies on exist
// Reported only: target-only cards, active+ruled cards with no bestof rows
// (expected for flat-rate cards).
//
//   npx tsx --env-file=.env.migrate scripts/migrate/07-verify.ts --confirm-db=fisense-prod

import { openDbs, run } from "./_shared";

const SCRIPT = "07-verify";

// usercards that already pointed at a missing card before the migration
// (found in Phase 0, 2026-10-12). Anything beyond these is a regression.
const KNOWN_DANGLING_CARD_IDS = new Set(["69cd7a4779ac41bb9051a69e"]);

run(SCRIPT, async () => {
  const { source, target, close } = await openDbs(SCRIPT, { needSource: true });
  const failures: string[] = [];
  const check = (ok: boolean, label: string) => {
    console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
    if (!ok) failures.push(label);
  };

  const srcCards = await source!.collection("cards").find({}, { projection: { slug: 1 } }).toArray();
  const tgtCards = await target
    .collection("cards")
    .find({}, { projection: { slug: 1, is_active: 1, rulesVersion: 1 } })
    .toArray();
  const tgtSlugs = new Set(tgtCards.map((c) => c.slug));
  const srcSlugs = new Set(srcCards.map((c) => c.slug));

  check(tgtSlugs.size === tgtCards.length, `no duplicate card slugs (${tgtCards.length} cards)`);
  const missing = [...srcSlugs].filter((s) => !tgtSlugs.has(s));
  check(!missing.length, `every source card slug in target${missing.length ? ` — missing ${missing.slice(0, 5).join(", ")}` : ""}`);
  console.log(`      target-only cards: ${tgtCards.filter((c) => !srcSlugs.has(c.slug)).length}`);

  const ids = new Set(tgtCards.map((c) => String(c._id)));
  const usercards = await target.collection("usercards").find({}, { projection: { cardId: 1 } }).toArray();
  const dangling = usercards.filter((u) => !ids.has(String(u.cardId)));
  const unexpected = dangling.filter((u) => !KNOWN_DANGLING_CARD_IDS.has(String(u.cardId)));
  check(
    !unexpected.length,
    `usercards linked: ${usercards.length - dangling.length}/${usercards.length}, ` +
      `${dangling.length - unexpected.length} known-dangling, ${unexpected.length} newly dangling`,
  );

  for (const name of ["cardrules", "cardmilestones"]) {
    const [s, t] = await Promise.all([
      source!.collection(name).countDocuments(),
      target.collection(name).countDocuments(),
    ]);
    check(s === t, `${name}: target ${t} = source ${s}`);
  }

  const version = new Map(tgtCards.map((c) => [c.slug, c.rulesVersion ?? 1]));
  const bestofs = await target
    .collection("cardbestofs")
    .find({}, { projection: { cardSlug: 1, rulesVersion: 1 } })
    .toArray();
  const stale = bestofs.filter((b) => (b.rulesVersion ?? 1) !== version.get(b.cardSlug));
  check(!stale.length, `cardbestofs: ${bestofs.length} rows, ${stale.length} stale or orphaned`);

  const active = tgtCards.filter((c) => c.is_active).map((c) => c.slug);
  const ruled = new Set(await target.collection("cardrules").distinct("cardSlug", { is_active: true }));
  const covered = new Set(bestofs.map((b) => b.cardSlug));
  const uncovered = active.filter((s) => ruled.has(s) && !covered.has(s));
  console.log(`      active cards with rules but no bestof rows: ${uncovered.length} (flat-rate cards expected)`);

  const required: [string, string][] = [
    ["cards", '{"slug":1}!u'],
    ["cardrules", '{"ruleKey":1}!u'],
    ["cardmilestones", '{"milestoneKey":1}!u'],
    ["cardbestofs", '{"cardSlug":1,"category":1}!u'],
  ];
  for (const [col, spec] of required) {
    const idx = await target.collection(col).indexes().catch(() => []);
    const have = idx.some((i) => JSON.stringify(i.key) + (i.unique ? "!u" : "") === spec);
    check(have, `index ${col} ${spec}`);
  }

  await close();
  if (failures.length) throw new Error(`${failures.length} check(s) failed`);
  console.log("\nall checks passed");
});
