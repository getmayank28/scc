// One-off backfill: repoint `usercards.cardId` at the live `cards` collection.
//
// A card-collection migration replaced `cards` wholesale, but left `usercards`
// pointing at the OLD ObjectIds — which now survive only in
// `cards_legacy_backup`. Every user wallet therefore joins to nothing and
// renders empty. This remaps each row by the card's stable `slug`:
//
//   usercards.cardId -> cards_legacy_backup._id -> .slug -> cards._id
//
// Rows whose cardId is absent from BOTH collections are unrecoverable here (the
// original card doc is simply gone); they're reported, never deleted.
//
// Safe to re-run: rows already pointing at a live card are skipped, so a second
// run matches nothing.
//
// Usage:
//   npx tsx --env-file=.env.local scripts/backfill-usercard-ids.ts --dry-run
//   npx tsx --env-file=.env.local scripts/backfill-usercard-ids.ts

import mongoose from "mongoose";
import dbConnect from "../src/lib/utils/dbConnet";

interface CardLite {
  _id: mongoose.Types.ObjectId;
  slug?: string;
  name?: string;
  bankName?: string;
}

interface UserCardLite {
  _id: mongoose.Types.ObjectId;
  userId: string;
  cardId: mongoose.Types.ObjectId;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  await dbConnect();
  const db = mongoose.connection.db;
  if (!db) throw new Error("no db handle");

  const userCards = db.collection<UserCardLite>("usercards");
  const live = db.collection<CardLite>("cards");
  const legacy = db.collection<CardLite>("cards_legacy_backup");

  const rows = await userCards.find({}).toArray();
  const liveIds = new Set(
    (await live.find({}).project({ _id: 1 }).toArray()).map((d) =>
      String(d._id),
    ),
  );

  // slug -> live card. Slugs are unique in `cards`; if duplicates ever appear,
  // first-wins is fine because they'd be the same card.
  const liveBySlug = new Map<string, CardLite>();
  for (const d of await live
    .find({})
    .project<CardLite>({ slug: 1, name: 1, bankName: 1 })
    .toArray()) {
    if (d.slug && !liveBySlug.has(d.slug)) liveBySlug.set(d.slug, d);
  }

  const legacyById = new Map<string, CardLite>();
  for (const d of await legacy
    .find({})
    .project<CardLite>({ slug: 1, name: 1, bankName: 1 })
    .toArray()) {
    legacyById.set(String(d._id), d);
  }

  // Track which (userId, cardId) pairs will exist so we honour the unique index
  // on {userId, cardId}: two legacy ids can collapse onto one live card.
  const claimed = new Set<string>();
  for (const r of rows) {
    if (liveIds.has(String(r.cardId))) {
      claimed.add(`${r.userId}::${String(r.cardId)}`);
    }
  }

  const remaps: { row: UserCardLite; to: CardLite; label: string }[] = [];
  const dupes: { row: UserCardLite; to: CardLite; label: string }[] = [];
  const unrecoverable: UserCardLite[] = [];
  let alreadyLive = 0;

  for (const row of rows) {
    const id = String(row.cardId);
    if (liveIds.has(id)) {
      alreadyLive++;
      continue;
    }

    const old = legacyById.get(id);
    const target = old?.slug ? liveBySlug.get(old.slug) : undefined;
    if (!target) {
      unrecoverable.push(row);
      continue;
    }

    const label = `${target.bankName ?? ""} ${target.name ?? target.slug}`.trim();
    const key = `${row.userId}::${String(target._id)}`;
    if (claimed.has(key)) {
      // The user already holds this card under another row — remapping would
      // violate the unique index. Drop the redundant row instead.
      dupes.push({ row, to: target, label });
      continue;
    }
    claimed.add(key);
    remaps.push({ row, to: target, label });
  }

  console.log(
    `[backfill-usercard-ids] ${rows.length} wallet row(s)` +
      (dryRun ? " (dry run, not writing)" : ""),
  );
  console.log(`  already pointing at a live card : ${alreadyLive}`);
  console.log(`  remappable by slug              : ${remaps.length}`);
  console.log(`  duplicate after remap (delete)  : ${dupes.length}`);
  console.log(`  unrecoverable (id in neither)   : ${unrecoverable.length}`);

  if (remaps.length > 0) {
    console.log("\n-- remaps --");
    for (const r of remaps) {
      console.log(`  ${String(r.row.cardId)} -> ${String(r.to._id)}  ${r.label}`);
    }
  }

  if (dupes.length > 0) {
    console.log("\n-- redundant rows (user already holds this card) --");
    for (const d of dupes) {
      console.log(`  row ${String(d.row._id)} user ${d.row.userId}  ${d.label}`);
    }
  }

  if (unrecoverable.length > 0) {
    const byId = new Map<string, number>();
    for (const u of unrecoverable) {
      byId.set(String(u.cardId), (byId.get(String(u.cardId)) ?? 0) + 1);
    }
    console.log(
      "\n-- unrecoverable cardIds (absent from `cards` AND `cards_legacy_backup`) --",
    );
    for (const [id, n] of [...byId].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${id}  (${n} row${n > 1 ? "s" : ""})`);
    }
    console.log("  These rows are left untouched; the source card doc is gone.");
  }

  if (!dryRun && (remaps.length > 0 || dupes.length > 0)) {
    if (remaps.length > 0) {
      const res = await userCards.bulkWrite(
        remaps.map((r) => ({
          updateOne: {
            filter: { _id: r.row._id },
            update: { $set: { cardId: r.to._id } },
          },
        })),
      );
      console.log(`\n[backfill-usercard-ids] remapped ${res.modifiedCount} row(s)`);
    }
    if (dupes.length > 0) {
      const res = await userCards.deleteMany({
        _id: { $in: dupes.map((d) => d.row._id) },
      });
      console.log(`[backfill-usercard-ids] deleted ${res.deletedCount} redundant row(s)`);
    }
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
