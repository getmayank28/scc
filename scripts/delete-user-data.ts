/**
 * Delete every account (and everything linked to it) for one phone number.
 *
 * Finds the users with that phoneNumber, then scans EVERY collection for
 * documents that reference them — by user id (`userId` / `user`, string or
 * ObjectId), by the phone number (bare or with the 91 prefix, e.g. WhatsApp
 * message source/destination, OTP rows), or by any of the accounts' emails
 * (case-insensitive: waitlist, email log, feedback). Scanning rather than a
 * fixed list means collections added later are covered too.
 *
 * SAFETY
 *
 * Dry run by default: prints what matches, writes nothing. Deleting needs
 * --commit AND --confirm-db=<database name>, so a run can't hit the wrong
 * database by accident. Irreversible — there is no undo.
 *
 *   npx tsx --env-file=.env.local scripts/delete-user-data.ts --phone=9876543210
 *   npx tsx --env-file=.env.local scripts/delete-user-data.ts --phone=9876543210 --commit --confirm-db=fisense-prod
 */

import mongoose from "mongoose";

const COMMIT = process.argv.includes("--commit");
const flag = (name: string) =>
  process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3) ?? null;

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function main() {
  const phone = flag("phone");
  if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
    throw new Error("Pass --phone=<10-digit Indian mobile number>");
  }
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");

  await mongoose.connect(uri, { autoIndex: false, autoCreate: false });
  const db = mongoose.connection.db!;

  if (COMMIT && flag("confirm-db") !== db.databaseName) {
    throw new Error(`Refusing to delete: pass --confirm-db=${db.databaseName}`);
  }
  console.log(`database: ${db.databaseName}  mode: ${COMMIT ? "DELETE" : "dry run"}\n`);

  const users = await db
    .collection("users")
    .find({ phoneNumber: phone })
    .project({ email: 1, provider: 1, name: 1 })
    .toArray();

  console.log(`accounts with ${phone}: ${users.length}`);
  for (const u of users) {
    console.log(`  ${u._id}  email=${u.email ?? "-"}  name=${u.name ?? "-"}  provider=${(u.provider ?? []).join("+")}`);
  }

  const ids = users.map((u) => u._id as mongoose.Types.ObjectId);
  const idValues = [...ids, ...ids.map((id) => id.toString())];
  const emails = users.map((u) => u.email).filter(Boolean) as string[];
  const phoneValues = [phone, `91${phone}`, `+91${phone}`];

  const refFields = ["userId", "user", "owner", "ownerId"];
  const phoneFields = ["phoneNumber", "phone", "source", "destination", "mobile"];
  const emailFields = ["email", "recipient", "emailLower"];

  const or: Record<string, unknown>[] = [
    ...refFields.map((f) => ({ [f]: { $in: idValues } })),
    ...phoneFields.map((f) => ({ [f]: { $in: phoneValues } })),
  ];
  if (emails.length) {
    const emailRegex = emails.map((e) => new RegExp(`^${escapeRegex(e)}$`, "i"));
    or.push(...emailFields.map((f) => ({ [f]: { $in: emailRegex } })));
  }
  // OTP send-rate rows are keyed "phone:<number>".
  or.push({ key: `phone:${phone}` });

  const collections = (await db.listCollections({}, { nameOnly: true }).toArray())
    .map((c) => c.name)
    .filter((n) => !n.startsWith("system."));

  let total = 0;
  const plan: { name: string; filter: Record<string, unknown>; n: number }[] = [];
  for (const name of collections.sort()) {
    const filter = name === "users" ? { _id: { $in: ids } } : { $or: or };
    if (name === "users" && ids.length === 0) continue;
    const n = await db.collection(name).countDocuments(filter);
    if (n > 0) {
      plan.push({ name, filter, n });
      total += n;
    }
  }

  console.log(`\nlinked documents: ${total}`);
  for (const p of plan) console.log(`  ${p.name.padEnd(28)} ${p.n}`);

  if (!COMMIT) {
    console.log("\ndry run — nothing deleted.");
    return;
  }

  for (const p of plan) {
    const { deletedCount } = await db.collection(p.name).deleteMany(p.filter);
    console.log(`deleted ${deletedCount} from ${p.name}`);
  }
  console.log("done.");
}

main()
  .catch((err) => {
    console.error(err.message ?? err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
