/**
 * Refresh live deals by hand — the same code the daily cron
 * (`/api/cron/cuelinks-sync`) runs after the transaction sync. Needs portals
 * mapped to campaigns first (scripts/cuelinks-map-portals.ts).
 *
 * Writes `liveoffers` and stamps `syncstates`.
 *
 *   npx tsx --env-file=.env.local scripts/cuelinks-offers.ts
 */

import mongoose from "mongoose";
import { refreshOffers } from "../src/lib/cuelinks/offers";

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log(`Database: ${mongoose.connection.db!.databaseName}`);
  console.log(await refreshOffers());
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
