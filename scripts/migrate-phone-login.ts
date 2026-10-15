/**
 * Prepare the `users` collection for WhatsApp-number login.
 *
 * THE PROBLEM
 *
 * Login moves from email (+ Google) to a verified WhatsApp number, and new
 * users no longer have an email at all. Two indexes block that:
 *
 *   - `email_1` is unique but NOT sparse. Every email-less user indexes as
 *     null, so the second phone-only sign-up fails with E11000. It must become
 *     sparse before the new login ships.
 *   - `phoneNumber` has no unique index, yet it is now the login identity. Two
 *     accounts sharing a verified number would make login ambiguous.
 *
 * WHAT THIS DOES
 *
 *   1. Reports: users with / without a verified number, and every verified
 *      number shared by more than one account (with each account's email,
 *      provider and wallet size, to decide which one keeps the number).
 *   2. With --commit:
 *        - rebuilds `email_1` as unique + sparse;
 *        - creates `phoneNumber_1` unique over verified numbers only. Refused
 *          while duplicates remain: resolve them first (e.g. set
 *          isPhoneVerified=false on the account that should not log in).
 *
 * Users without a verified number never got past the old onboarding gate, so
 * they had no app access; they are reported, not changed.
 *
 * SAFETY
 *
 * Dry-run by default. Idempotent: a second --commit run is a no-op.
 *
 *   npx tsx --env-file=.env.local scripts/migrate-phone-login.ts
 *   npx tsx --env-file=.env.local scripts/migrate-phone-login.ts --commit
 */

import mongoose from "mongoose";

const COMMIT = process.argv.includes("--commit");

type IndexInfo = {
  name: string;
  key: Record<string, number>;
  unique?: boolean;
  sparse?: boolean;
  partialFilterExpression?: Record<string, unknown>;
};

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");

  await mongoose.connect(uri, { autoIndex: false, autoCreate: false });
  const db = mongoose.connection.db!;
  const users = db.collection("users");
  const userCards = db.collection("usercards");

  console.log(`database: ${db.databaseName}  mode: ${COMMIT ? "COMMIT" : "dry run"}\n`);

  const total = await users.countDocuments();
  const verified = await users.countDocuments({ isPhoneVerified: true });
  const unverifiedWithPhone = await users.countDocuments({
    isPhoneVerified: { $ne: true },
    phoneNumber: { $exists: true, $nin: [null, ""] },
  });
  console.log(`users:                               ${total}`);
  console.log(`  with verified phone (can log in):  ${verified}`);
  console.log(`  without verified phone:            ${total - verified}`);
  console.log(`    of which have an unverified no.: ${unverifiedWithPhone}\n`);

  const duplicates = await users
    .aggregate<{ _id: string; ids: mongoose.Types.ObjectId[] }>([
      { $match: { isPhoneVerified: true } },
      { $group: { _id: "$phoneNumber", ids: { $push: "$_id" }, n: { $sum: 1 } } },
      { $match: { n: { $gt: 1 } } },
    ])
    .toArray();

  if (duplicates.length === 0) {
    console.log("verified numbers shared by several accounts: none\n");
  } else {
    console.log(`verified numbers shared by several accounts: ${duplicates.length}`);
    for (const dup of duplicates) {
      console.log(`  ${dup._id}`);
      for (const id of dup.ids) {
        const u = await users.findOne(
          { _id: id },
          { projection: { email: 1, provider: 1, employmentType: 1 } },
        );
        const cards = await userCards.countDocuments({ userId: id.toString() });
        console.log(
          `    ${id}  email=${u?.email ?? "-"}  provider=${(u?.provider ?? []).join("+")}  ` +
            `employment=${u?.employmentType ?? "-"}  cards=${cards}`,
        );
      }
    }
    console.log();
  }

  const indexes = (await users.indexes()) as IndexInfo[];
  const emailIndex = indexes.find((i) => i.key.email === 1 && Object.keys(i.key).length === 1);
  const phoneIndex = indexes.find((i) => i.key.phoneNumber === 1 && Object.keys(i.key).length === 1);

  const emailOk = !!emailIndex?.unique && !!emailIndex?.sparse;
  const phoneOk =
    !!phoneIndex?.unique &&
    (phoneIndex?.partialFilterExpression as { isPhoneVerified?: boolean } | undefined)
      ?.isPhoneVerified === true;

  console.log(`email index:  ${emailIndex ? JSON.stringify({ unique: emailIndex.unique, sparse: emailIndex.sparse }) : "missing"}  ${emailOk ? "OK" : "→ rebuild as unique+sparse"}`);
  console.log(`phone index:  ${phoneIndex ? JSON.stringify({ unique: phoneIndex.unique, partial: phoneIndex.partialFilterExpression }) : "missing"}  ${phoneOk ? "OK" : "→ create unique over verified numbers"}\n`);

  if (!COMMIT) {
    console.log("dry run — nothing written. Re-run with --commit to apply.");
    return;
  }

  if (!emailOk) {
    if (emailIndex) await users.dropIndex(emailIndex.name);
    await users.createIndex({ email: 1 }, { unique: true, sparse: true, name: "email_1" });
    console.log("rebuilt email_1 as unique + sparse");
  }

  if (!phoneOk) {
    if (duplicates.length > 0) {
      console.log("NOT creating phoneNumber_1: resolve the shared numbers above first, then re-run.");
      process.exitCode = 1;
      return;
    }
    if (phoneIndex) await users.dropIndex(phoneIndex.name);
    await users.createIndex(
      { phoneNumber: 1 },
      {
        unique: true,
        partialFilterExpression: { isPhoneVerified: true },
        name: "phoneNumber_1",
      },
    );
    console.log("created phoneNumber_1 (unique over verified numbers)");
  }

  console.log("done.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
