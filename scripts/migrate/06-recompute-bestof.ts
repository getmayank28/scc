// Step 6 — recompute `cardbestofs` on TARGET for every card, using the same
// recomputeBestOfForCard the admin routes use.
//
// Step 4 copied stage's bestof rows, which were current on stage; recomputing
// against the target's own cards + rules confirms they still hold there and
// covers anything step 3 changed. Same as `npm run bestof:recompute`, but bound
// to TARGET_MONGODB_URI behind the --confirm-db guard instead of MONGODB_URI.
//
// A card whose rules never beat its base rate writes 0 rows by design — the
// engine then falls back to base_reward_rate, which is correct for flat-rate
// cards. Catalogue-only cards (no `rewards`, i.e. the prod-only cards in
// scripts/data/prod-only-cards.json) have nothing to compute and are skipped.
//
//   npx tsx --env-file=.env.migrate scripts/migrate/06-recompute-bestof.ts --confirm-db=fisense-prod [--commit] [--active]

import mongoose from "mongoose";
import CardModel from "../../src/models/Card";
import { recomputeBestOfForCard } from "../../src/lib/advisor/recompute";
import { COMMIT, openDbs, run } from "./_shared";

const SCRIPT = "06-recompute-bestof";

run(SCRIPT, async () => {
  // Runs every guard; the default connection below only opens once they pass.
  const { target, targetUri, close } = await openDbs(SCRIPT, { needSource: false });
  const filter = {
    rewards: { $exists: true },
    ...(process.argv.includes("--active") ? { is_active: true } : {}),
  };
  const count = await target.collection("cards").countDocuments(filter);
  const skipped = await target.collection("cards").countDocuments({ rewards: { $exists: false } });
  console.log(`cards to recompute: ${count} (${skipped} catalogue-only card(s) without rewards skipped)`);
  await close();
  if (!COMMIT) return;

  // recomputeBestOfForCard uses the app's models on the default connection.
  await mongoose.connect(targetUri, { autoIndex: false });
  const cards = await CardModel.find(filter).select("slug").lean<{ slug: string }[]>();

  let written = 0;
  const empty: string[] = [];
  const failed: string[] = [];
  for (const c of cards) {
    try {
      const r = await recomputeBestOfForCard(c.slug);
      written += r.written;
      if (!r.written) empty.push(c.slug);
    } catch (err) {
      failed.push(c.slug);
      console.error(`  ${c.slug} FAILED:`, err instanceof Error ? err.message : err);
    }
  }
  console.log(`recomputed ${cards.length} card(s): ${written} row(s) written, ${empty.length} with 0 rows, ${failed.length} failed`);
  await mongoose.disconnect();
  if (failed.length) throw new Error(`${failed.length} card(s) failed to recompute`);
});
