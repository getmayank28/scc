/**
 * Run the Cuelinks transaction sync by hand — the same code the daily cron
 * (`/api/cron/cuelinks-sync`) runs. Use it to backfill or to re-pull a window.
 *
 * Writes `affiliatetransactions` and advances the sync cursor in `syncstates`.
 *
 *   npx tsx --env-file=.env.local scripts/cuelinks-sync.ts
 *   npx tsx --env-file=.env.local scripts/cuelinks-sync.ts --since=2026-09-01
 */

import mongoose from "mongoose";
import { syncTransactions } from "../src/lib/cuelinks/sync";

async function main() {
  const sinceArg = process.argv.find((a) => a.startsWith("--since="))?.slice(8);
  const since = sinceArg ? new Date(sinceArg) : undefined;
  if (since && Number.isNaN(since.getTime())) throw new Error(`Bad --since: ${sinceArg}`);

  await mongoose.connect(process.env.MONGODB_URI!);
  console.log(`Database: ${mongoose.connection.db!.databaseName}`);
  const result = await syncTransactions({ since });
  console.log(result);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
