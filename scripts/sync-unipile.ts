// Sync all connected Unipile mailboxes (or one) into StoredEmail.
// Run this BEFORE the Unipile trial expires to bank a year of mail locally.
//
//   npx tsx --env-file=.env.local scripts/sync-unipile.ts            # all
//   npx tsx --env-file=.env.local scripts/sync-unipile.ts <accountId>

import mongoose from "mongoose";
import UnipileAccount from "../src/models/UnipileAccount";
import { syncMailbox } from "../src/lib/unipile/sync";

async function main() {
  const [accountIdArg] = process.argv.slice(2);
  await mongoose.connect(process.env.MONGODB_URI!);

  const filter = accountIdArg
    ? { accountId: accountIdArg, status: "connected" }
    : { status: "connected" };
  const accounts = await UnipileAccount.find(filter).lean();
  if (accounts.length === 0) {
    console.error("no connected accounts to sync");
    process.exit(1);
  }

  for (const acc of accounts) {
    console.log(`syncing ${acc.emailAddress ?? acc.accountId} …`);
    const r = await syncMailbox({
      userId: acc.userId,
      accountId: acc.accountId,
      emailAddress: acc.emailAddress,
    });
    console.log(
      `  stored=${r.stored} throughDate=${r.syncedThroughDate.toISOString().slice(0, 10)} failed=[${r.failedDomains.join(", ")}]`,
    );
  }

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
