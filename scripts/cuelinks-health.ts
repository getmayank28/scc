/**
 * Run the link-health check by hand — the same code the daily cron runs last.
 * Checks due targets (most-clicked first) until the time budget runs out.
 *
 * Writes `linkhealths`. Reads Cuelinks (convert API) and fetches destination
 * pages; never fetches affiliate links.
 *
 *   npx tsx --env-file=.env.local scripts/cuelinks-health.ts                 # 50s budget
 *   npx tsx --env-file=.env.local scripts/cuelinks-health.ts --budget=600    # a full pass
 *   npx tsx --env-file=.env.local scripts/cuelinks-health.ts --all           # make every target due first
 */

import mongoose from "mongoose";
import LinkHealth from "../src/models/LinkHealth";
import { runHealthCheck } from "../src/lib/affiliate/health";

async function main() {
  const budgetArg = process.argv.find((a) => a.startsWith("--budget="))?.slice(9);
  const budgetS = budgetArg ? Number(budgetArg) : 50;
  if (!Number.isFinite(budgetS) || budgetS <= 0) throw new Error(`Bad --budget: ${budgetArg}`);

  await mongoose.connect(process.env.MONGODB_URI!);
  console.log(`Database: ${mongoose.connection.db!.databaseName}`);
  if (process.argv.includes("--all")) await LinkHealth.updateMany({}, { $set: { dueAt: null } });

  const t = Date.now();
  const result = await runHealthCheck({ deadline: t + budgetS * 1000 });
  console.log(result, `in ${((Date.now() - t) / 1000).toFixed(1)}s`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
