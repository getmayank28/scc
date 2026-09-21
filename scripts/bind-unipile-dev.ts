// One-off dev helper: bind an already-connected Unipile account (e.g. one you
// connected straight from the dashboard) to an app user, so you can exercise
// the "fetch my own connected mailbox" flow without running hosted auth.
//
//   npx tsx --env-file=.env.local scripts/bind-unipile-dev.ts <userEmail> [accountId]
//
// If accountId is omitted, the single Unipile account is used when there is
// exactly one. This writes a real UnipileAccount row — the same thing the
// hosted-auth callback would write.

import mongoose from "mongoose";
import UserModel from "../src/models/User";
import UnipileAccount from "../src/models/UnipileAccount";

async function main() {
  const [userEmail, accountIdArg] = process.argv.slice(2);
  if (!userEmail) {
    console.error("usage: bind-unipile-dev.ts <userEmail> [accountId]");
    process.exit(1);
  }

  const dsn = process.env.UNIPILE_DSN!;
  const key = process.env.UNIPILE_API_KEY!;
  const base = /^https?:\/\//.test(dsn) ? dsn : `https://${dsn}`;

  // Resolve the account from Unipile.
  const res = await fetch(`${base.replace(/\/$/, "")}/api/v1/accounts`, {
    headers: { "X-API-KEY": key },
  });
  const { items } = (await res.json()) as {
    items: Array<{ id: string; type?: string; name?: string }>;
  };
  const account = accountIdArg
    ? items.find((a) => a.id === accountIdArg)
    : items.length === 1
      ? items[0]
      : undefined;
  if (!account) {
    console.error(
      accountIdArg
        ? `account ${accountIdArg} not found`
        : `expected exactly one account, found ${items.length}; pass an accountId`,
    );
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI!);
  const user = await UserModel.findOne({ email: userEmail.toLowerCase() });
  if (!user) {
    console.error(`no app user with email ${userEmail}`);
    process.exit(1);
  }

  await UnipileAccount.findOneAndUpdate(
    { accountId: account.id },
    {
      $set: {
        userId: user._id.toString(),
        provider: account.type,
        emailAddress: account.name,
        status: "connected",
        connectedAt: new Date(),
      },
    },
    { upsert: true },
  );

  console.log(
    `bound account ${account.id} (${account.name}) → user ${userEmail} [${user._id}]`,
  );
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
