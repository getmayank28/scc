// Recompute the CardBestOf precompute cache for EVERY card currently in the
// database. Walks CardAdvisor itself, so cards added directly to Mongo (admin
// rule upload, direct Atlas edits) are covered.
//
// Use this after bulk data changes when you're unsure whether cardbestofs is up
// to date. Idempotent: re-running produces the same payloads.
//
// Usage:
//   npm run bestof:recompute
//   npm run bestof:recompute -- --active       (only is_active cards)
//   npm run bestof:recompute -- --key=card_x   (single card)
//
// Reads MONGODB_URI from .env.local via tsx's --env-file flag.

import mongoose from "mongoose";
import dbConnect from "../src/lib/utils/dbConnet";
import CardAdvisorModel from "../src/models/Card";
import { recomputeBestOfForCard } from "../src/lib/advisor/recompute";

function readValueFlag(name: string): string | null {
  const prefix = `--${name}=`;
  const arg = process.argv.find((a) => a.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : null;
}

async function main() {
  const activeOnly = process.argv.includes("--active");
  const singleKey = readValueFlag("key");

  await dbConnect();

  const filter = singleKey
    ? { slug: singleKey }
    : activeOnly
      ? { is_active: true }
      : {};

  const cards = await CardAdvisorModel.find(filter)
    .select("slug rulesVersion")
    .lean<{ slug: string; rulesVersion?: number }[]>();

  console.log(
    `[recompute-bestof] recomputing ${cards.length} card(s)` +
      (activeOnly ? " (active only)" : "") +
      (singleKey ? ` (key=${singleKey})` : ""),
  );

  let totalWritten = 0;
  let failed = 0;
  for (const c of cards) {
    try {
      const { written } = await recomputeBestOfForCard(c.slug);
      totalWritten += written;
      console.log(
        `  ${c.slug}  v${c.rulesVersion ?? 1}  ->  ${written} row(s)`,
      );
    } catch (err) {
      failed++;
      console.error(`  ${c.slug}  FAILED:`, err);
    }
  }

  console.log(
    `[recompute-bestof] done: ${cards.length} card(s), ` +
      `${totalWritten} CardBestOf row(s) written, ${failed} failed`,
  );

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("[recompute-bestof] fatal:", err);
  process.exit(1);
});
