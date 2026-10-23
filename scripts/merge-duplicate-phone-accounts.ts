/**
 * Merge accounts that share one verified phone number into a single account.
 *
 * THE PROBLEM
 *
 * Login is by WhatsApp number now, and `users.phoneNumber` must be unique
 * among verified numbers (scripts/migrate-phone-login.ts refuses to build that
 * index while duplicates exist). Under email/Google login one person could
 * verify the same number on several accounts. Without a merge, a phone login
 * lands on whichever account Mongo returns first and the rest disappear.
 *
 * WHAT THIS DOES, per verified number held by more than one account:
 *
 *   1. Keeps the account with the most data (cards + spends + redemptions).
 *      Ties go to one with employment set, then to the newest.
 *   2. Moves every reference to the other accounts onto the kept one. That is
 *      `userId` / `user` in ANY collection, as a string or an ObjectId. A card
 *      the kept account already has is dropped rather than duplicated
 *      (usercards is unique on userId + cardId).
 *   3. Deletes the other accounts.
 *   4. Fills blanks on the kept account from the others (name, email,
 *      employment + income as a pair), unions `provider`, and records each
 *      merged account in `mergedFrom` for audit.
 *
 * SAFETY
 *
 * Dry run by default. Writing needs --commit AND --confirm-db=<database>.
 * Re-runnable: a crash part-way leaves the number still duplicated, and a
 * re-run picks it up again. Take a mongodump first. There is no undo.
 *
 *   npx tsx --env-file=.env.prod scripts/merge-duplicate-phone-accounts.ts
 *   npx tsx --env-file=.env.prod scripts/merge-duplicate-phone-accounts.ts --commit --confirm-db=fisense-prod
 *   ... --phone=9876543210   (limit to one number)
 */

import mongoose from "mongoose";

const COMMIT = process.argv.includes("--commit");
const flag = (name: string) =>
  process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3) ?? null;

type ObjectId = mongoose.Types.ObjectId;
type UserDoc = {
  _id: ObjectId;
  email?: string;
  name?: string;
  phoneNumber: string;
  provider?: string[];
  employmentType?: string;
  salaryRange?: string;
};

const REF_FIELDS = ["userId", "user"];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  await mongoose.connect(uri, { autoIndex: false, autoCreate: false });
  const db = mongoose.connection.db!;

  if (COMMIT && flag("confirm-db") !== db.databaseName) {
    throw new Error(`Refusing to write: pass --confirm-db=${db.databaseName}`);
  }
  console.log(`database: ${db.databaseName}  mode: ${COMMIT ? "COMMIT" : "dry run"}\n`);

  const users = db.collection<UserDoc>("users");
  const onlyPhone = flag("phone");

  const groups = await users
    .aggregate<{ _id: string; ids: ObjectId[] }>([
      { $match: { isPhoneVerified: true, ...(onlyPhone && { phoneNumber: onlyPhone }) } },
      { $group: { _id: "$phoneNumber", ids: { $push: "$_id" }, n: { $sum: 1 } } },
      { $match: { n: { $gt: 1 } } },
      { $sort: { _id: 1 } },
    ])
    .toArray();

  if (groups.length === 0) {
    console.log("no verified number is shared by several accounts — nothing to do.");
    return;
  }

  // Collections that can hold a user reference (everything but users itself).
  const collections = (await db.listCollections({}, { nameOnly: true }).toArray())
    .map((c) => c.name)
    .filter((n) => n !== "users" && !n.startsWith("system."));

  const refFilter = (id: ObjectId) => ({
    $or: REF_FIELDS.flatMap((f) => [{ [f]: id }, { [f]: id.toString() }]),
  });

  for (const group of groups) {
    const accounts = await users.find({ _id: { $in: group.ids } }).toArray();

    // Data held per account, per collection.
    const held = new Map<string, Record<string, number>>();
    for (const a of accounts) {
      const counts: Record<string, number> = {};
      for (const c of collections) {
        const n = await db.collection(c).countDocuments(refFilter(a._id));
        if (n) counts[c] = n;
      }
      held.set(a._id.toString(), counts);
    }
    const score = (a: UserDoc) => {
      const c = held.get(a._id.toString())!;
      return (c.usercards ?? 0) + (c.spendtransactions ?? 0) + (c.redemptions ?? 0);
    };
    const ranked = [...accounts].sort(
      (x, y) =>
        score(y) - score(x) ||
        Number(!!y.employmentType) - Number(!!x.employmentType) ||
        y._id.getTimestamp().getTime() - x._id.getTimestamp().getTime(),
    );
    const kept = ranked[0];
    const others = ranked.slice(1);

    // Blanks on the kept account, filled from the others (best-ranked first).
    const patch: Partial<UserDoc> = {};
    for (const o of others) {
      if (!kept.name && !patch.name && o.name) patch.name = o.name;
      if (!kept.email && !patch.email && o.email) patch.email = o.email.toLowerCase();
      if (!kept.employmentType && !patch.employmentType && o.employmentType) {
        patch.employmentType = o.employmentType;
        if (o.salaryRange) patch.salaryRange = o.salaryRange;
      }
    }
    const providers = [...new Set(accounts.flatMap((a) => a.provider ?? []))];

    const describe = (a: UserDoc) => {
      const c = held.get(a._id.toString())!;
      const data = Object.entries(c).map(([k, v]) => `${k}=${v}`).join(" ") || "no linked data";
      return `${a._id}  email=${a.email ?? "-"}  name=${a.name ?? "-"}  employment=${a.employmentType ?? "-"}  [${data}]`;
    };
    console.log(`${group._id}: ${accounts.length} accounts`);
    console.log(`  KEEP   ${describe(kept)}`);
    for (const o of others) console.log(`  merge  ${describe(o)}`);
    if (Object.keys(patch).length) console.log(`  fill on kept: ${JSON.stringify(patch)}`);

    if (!COMMIT) {
      console.log();
      continue;
    }

    for (const o of others) {
      // Cards the kept account already holds would collide on the unique
      // (userId, cardId) index — drop the duplicate instead of moving it.
      const keptCards = await db
        .collection("usercards")
        .find({ userId: kept._id.toString() })
        .project({ cardId: 1 })
        .toArray();
      const { deletedCount: dupCards } = await db.collection("usercards").deleteMany({
        userId: o._id.toString(),
        cardId: { $in: keptCards.map((c) => c.cardId) },
      });
      if (dupCards) console.log(`  dropped ${dupCards} duplicate card(s) from ${o._id}`);

      for (const c of collections) {
        for (const f of REF_FIELDS) {
          const asId = await db.collection(c).updateMany({ [f]: o._id }, { $set: { [f]: kept._id } });
          const asString = await db
            .collection(c)
            .updateMany({ [f]: o._id.toString() }, { $set: { [f]: kept._id.toString() } });
          const moved = asId.modifiedCount + asString.modifiedCount;
          if (moved) console.log(`  moved ${moved} ${c}.${f} from ${o._id}`);
        }
      }
    }

    // Delete the merged accounts before filling the kept one, so a copied
    // email doesn't collide with the account it came from on the unique index.
    await users.deleteMany({ _id: { $in: others.map((o) => o._id) } });
    await users.updateOne(
      { _id: kept._id },
      {
        $set: { ...patch, provider: providers },
        $push: {
          mergedFrom: {
            $each: others.map((o) => ({
              _id: o._id,
              email: o.email ?? null,
              name: o.name ?? null,
              mergedAt: new Date(),
            })),
          },
        } as never,
      },
    );
    console.log(`  deleted ${others.length} account(s); kept ${kept._id}\n`);
  }

  console.log(COMMIT ? "done." : "dry run — nothing written. Re-run with --commit to apply.");
}

main()
  .catch((err) => {
    console.error(err.message ?? err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
