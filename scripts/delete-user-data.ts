/**
 * Delete every account (and everything linked to it) for a phone number or
 * for one or more emails.
 *
 * Finds the matching users, then scans EVERY collection for
 * documents that reference them — by user id (`userId` / `user`, string or
 * ObjectId), by the phone number (bare or with the 91 prefix, e.g. WhatsApp
 * message source/destination, OTP rows), or by any of the accounts' emails
 * (case-insensitive: waitlist, email log, feedback). Scanning rather than a
 * fixed list means collections added later are covered too.
 *
 * With --email, a matched account's phone number is only used to find
 * phone-keyed records (WhatsApp messages, OTP rows) when no OTHER account
 * shares that number — otherwise those records belong to someone else too.
 *
 * SAFETY
 *
 * Dry run by default: prints what matches, writes nothing. Deleting needs
 * --commit AND --confirm-db=<database name>, so a run can't hit the wrong
 * database by accident. Irreversible — there is no undo.
 *
 *   npx tsx --env-file=.env.local scripts/delete-user-data.ts --phone=9876543210
 *   npx tsx --env-file=.env.local scripts/delete-user-data.ts --phone=9876543210 --commit --confirm-db=fisense-prod
 *   npx tsx --env-file=.env.local scripts/delete-user-data.ts --email=a@x.com,b@y.com
 *
 * --keep=<collection,...> leaves those collections untouched (e.g. cached
 * mailbox data you want to keep): they're listed as kept, never deleted.
 */

import mongoose from "mongoose";

const COMMIT = process.argv.includes("--commit");
const flag = (name: string) =>
  process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3) ?? null;

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function main() {
  const phone = flag("phone");
  const emailArgs = (flag("email") ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  if (phone ? emailArgs.length > 0 : emailArgs.length === 0) {
    throw new Error("Pass either --phone=<10-digit number> or --email=<a@x.com,...>");
  }
  if (phone && !/^[6-9]\d{9}$/.test(phone)) {
    throw new Error("--phone must be a 10-digit Indian mobile number");
  }
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");

  await mongoose.connect(uri, { autoIndex: false, autoCreate: false });
  const db = mongoose.connection.db!;

  if (COMMIT && flag("confirm-db") !== db.databaseName) {
    throw new Error(`Refusing to delete: pass --confirm-db=${db.databaseName}`);
  }
  console.log(`database: ${db.databaseName}  mode: ${COMMIT ? "DELETE" : "dry run"}\n`);

  const emailMatchers = emailArgs.map((e) => new RegExp(`^${escapeRegex(e)}$`, "i"));
  const users = await db
    .collection("users")
    .find(phone ? { phoneNumber: phone } : { email: { $in: emailMatchers } })
    .project({ email: 1, provider: 1, name: 1, phoneNumber: 1 })
    .toArray();

  console.log(`accounts for ${phone ?? emailArgs.join(", ")}: ${users.length}`);
  for (const u of users) {
    console.log(`  ${u._id}  email=${u.email ?? "-"}  phone=${u.phoneNumber ?? "-"}  name=${u.name ?? "-"}  provider=${(u.provider ?? []).join("+")}`);
  }

  const ids = users.map((u) => u._id as mongoose.Types.ObjectId);
  const idValues = [...ids, ...ids.map((id) => id.toString())];
  // Emails asked for are matched even with no account (waitlist, email log).
  const emails = [
    ...new Set([...emailArgs, ...(users.map((u) => u.email).filter(Boolean) as string[])]),
  ];

  // Phone numbers whose records are safe to delete: the --phone itself, or in
  // email mode, numbers no account outside this set uses.
  const phones: string[] = [];
  if (phone) {
    phones.push(phone);
  } else {
    for (const p of new Set(users.map((u) => u.phoneNumber).filter(Boolean) as string[])) {
      const others = await db
        .collection("users")
        .countDocuments({ phoneNumber: p, _id: { $nin: ids } });
      if (others === 0) phones.push(p);
      else console.log(`  phone ${p} is shared with ${others} other account(s): its WhatsApp/OTP records are kept`);
    }
  }
  const phoneValues = phones.flatMap((p) => [p, `91${p}`, `+91${p}`]);

  const refFields = ["userId", "user", "owner", "ownerId"];
  const phoneFields = ["phoneNumber", "phone", "source", "destination", "mobile"];
  const emailFields = ["email", "recipient", "emailLower"];

  const or: Record<string, unknown>[] = [
    ...refFields.map((f) => ({ [f]: { $in: idValues } })),
    ...(phoneValues.length ? phoneFields.map((f) => ({ [f]: { $in: phoneValues } })) : []),
  ];
  if (emails.length) {
    const emailRegex = emails.map((e) => new RegExp(`^${escapeRegex(e)}$`, "i"));
    or.push(...emailFields.map((f) => ({ [f]: { $in: emailRegex } })));
  }
  // OTP send-rate rows are keyed "phone:<number>".
  if (phones.length) or.push({ key: { $in: phones.map((p) => `phone:${p}`) } });

  const keep = new Set(
    (flag("keep") ?? "").split(",").map((c) => c.trim()).filter(Boolean),
  );
  const collections = (await db.listCollections({}, { nameOnly: true }).toArray())
    .map((c) => c.name)
    .filter((n) => !n.startsWith("system."));
  for (const k of keep) {
    if (!collections.includes(k)) throw new Error(`--keep: no collection named "${k}"`);
  }

  let total = 0;
  const plan: { name: string; filter: Record<string, unknown>; n: number }[] = [];
  for (const name of collections.sort()) {
    const filter = name === "users" ? { _id: { $in: ids } } : { $or: or };
    if (name === "users" && ids.length === 0) continue;
    const n = await db.collection(name).countDocuments(filter);
    if (n === 0) continue;
    if (keep.has(name)) {
      console.log(`  keeping ${name} (${n} linked)`);
      continue;
    }
    plan.push({ name, filter, n });
    total += n;
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
