/**
 * Backfill `bankId` and `network` on the `cards` collection.
 *
 * THE PROBLEM
 *
 * Card documents cannot say who issued them:
 *
 *   - `bankId` is null on all 373 cards, so every join through it
 *     (`Giftor.find({ bankId: card.bankId })`) silently matches nothing.
 *   - `bankName` does not hold a bank. It holds the NETWORK — "visa",
 *     "mastercard", "rupay", "amex", "diners" — which is why the voucher CTA
 *     reported "No voucher partner listed for visa yet".
 *   - `network` is unset on every card, while `issuer` holds the real network
 *     list. `issuer` is the better source: it keeps ALL networks a card is
 *     offered on (95 cards are multi-network), where `bankName` kept only one.
 *
 * WHAT THIS WRITES, per card:
 *
 *   bankId    <- the bank whose slug the card slug ends with (see
 *                `resolveCardBank`). Card slugs are `<card-name>-<bank-slug>`.
 *   network   <- `issuer`, lowercased and filtered to the CardNetwork enum.
 *   bankName  <- the resolved bank's display name, replacing the network.
 *                The field is `required` in the schema, so it is corrected
 *                rather than cleared.
 *
 * `issuer` is left untouched: it is the source of truth this reads from, and
 * keeping it lets the script be re-run or audited after the fact.
 *
 * It also repairs one `banks` row: Standard Chartered's slug is
 * "standard0-chartered-bank" (a typo), which is why its 7 cards resolve to no
 * bank at all. Fixing the slug is what lets them resolve.
 *
 * SAFETY
 *
 * Dry-run by default — prints what it would change and writes nothing.
 * Pass `--commit` to apply. Idempotent: a second run is a no-op.
 *
 *   npx tsx --env-file=.env.local scripts/backfill-card-bank.ts
 *   npx tsx --env-file=.env.local scripts/backfill-card-bank.ts --commit
 */

import mongoose from "mongoose";
import { matchBankBySlug } from "../src/lib/utils/resolveCardBank";

/** Mirrors `CardNetwork` in src/lib/logic/advisor/cards.ts. */
const NETWORKS = new Set(["visa", "mastercard", "amex", "rupay", "diners"]);

/** The typo'd bank slug and what it should be. */
const BANK_SLUG_FIXES: Record<string, string> = {
  "standard0-chartered-bank": "standard-chartered-bank",
};

interface BankRow {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug?: string;
}

async function main() {
  const commit = process.argv.includes("--commit");
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");

  await mongoose.connect(uri);
  const db = mongoose.connection.db!;
  const banksCol = db.collection("banks");
  const cardsCol = db.collection("cards");

  console.log(commit ? "MODE: COMMIT\n" : "MODE: DRY RUN (pass --commit to apply)\n");

  // --- 1. Repair bank slugs, so the cards that depend on them can resolve. ---
  let slugFixes = 0;
  for (const [bad, good] of Object.entries(BANK_SLUG_FIXES)) {
    const row = await banksCol.findOne({ slug: bad });
    if (!row) continue;
    console.log(`bank slug: "${bad}" -> "${good}" (${row.name})`);
    slugFixes++;
    if (commit) {
      await banksCol.updateOne({ _id: row._id }, { $set: { slug: good } });
    }
  }
  if (!slugFixes) console.log("bank slugs: nothing to fix");

  // Read banks AFTER the repair so resolution sees the corrected slugs. On a
  // dry run the fix is not persisted, so apply it in memory to preview
  // honestly — otherwise the run would under-report what --commit achieves.
  const banks = (await banksCol
    .find({}, { projection: { name: 1, slug: 1 } })
    .toArray()) as unknown as BankRow[];
  if (!commit) {
    for (const b of banks) {
      const good = b.slug ? BANK_SLUG_FIXES[b.slug] : undefined;
      if (good) b.slug = good;
    }
  }

  // --- 2. Backfill the cards. ---
  const cards = await cardsCol
    .find(
      {},
      { projection: { slug: 1, name: 1, bankName: 1, bankId: 1, issuer: 1, network: 1, is_active: 1 } },
    )
    .toArray();

  const ops: mongoose.mongo.AnyBulkWriteOperation[] = [];
  const unresolved: string[] = [];
  const noNetwork: string[] = [];
  const byBank = new Map<string, number>();
  let alreadyDone = 0;

  for (const card of cards) {
    const slug = String(card.slug ?? "");
    const bank = matchBankBySlug(slug, banks);

    if (!bank) {
      unresolved.push(`${slug} (active=${!!card.is_active})`);
      continue;
    }

    // `issuer` is the network list. Normalize and drop anything unrecognised
    // rather than writing a value the CardNetwork union does not allow.
    const issuer = Array.isArray(card.issuer) ? card.issuer : [];
    const network = [
      ...new Set(
        issuer
          .map((n: unknown) => String(n).toLowerCase().trim())
          .filter((n: string) => NETWORKS.has(n)),
      ),
    ];
    if (!network.length) noNetwork.push(slug);

    const set: Record<string, unknown> = {};
    if (String(card.bankId ?? "") !== String(bank._id)) set.bankId = bank._id;
    if (card.bankName !== bank.name) set.bankName = bank.name;
    // Only write `network` when we have one — an empty array would replace an
    // unset field with a misleading "known to be none".
    if (
      network.length &&
      JSON.stringify(card.network ?? null) !== JSON.stringify(network)
    ) {
      set.network = network;
    }

    if (!Object.keys(set).length) {
      alreadyDone++;
      continue;
    }

    byBank.set(bank.name, (byBank.get(bank.name) ?? 0) + 1);
    ops.push({ updateOne: { filter: { _id: card._id }, update: { $set: set } } });
  }

  console.log(`\ncards scanned:     ${cards.length}`);
  console.log(`to update:         ${ops.length}`);
  console.log(`already correct:   ${alreadyDone}`);
  console.log(`unresolved bank:   ${unresolved.length}`);
  if (unresolved.length) console.log("  ", unresolved.slice(0, 20));
  console.log(`no usable network: ${noNetwork.length}`);
  if (noNetwork.length) console.log("  ", noNetwork.slice(0, 20));

  console.log("\nupdates by bank:");
  for (const [name, n] of [...byBank.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`   ${String(n).padStart(4)}  ${name}`);
  }

  const sample = cards.find((c) => c.slug === "simplyclick-sbi-card-sbi-card");
  if (sample) {
    const bank = matchBankBySlug(String(sample.slug), banks);
    console.log(
      `\nsample — ${sample.slug}\n  bankName "${sample.bankName}" -> "${bank?.name}"` +
        `\n  bankId   null -> ${bank?._id}` +
        `\n  network  unset -> ${JSON.stringify(sample.issuer)}`,
    );
  }

  if (!commit) {
    console.log("\nDry run — nothing written. Re-run with --commit to apply.");
    await mongoose.disconnect();
    return;
  }

  if (ops.length) {
    const res = await cardsCol.bulkWrite(ops, { ordered: false });
    console.log(`\nwrote: ${res.modifiedCount} modified`);
  } else {
    console.log("\nnothing to write");
  }

  // --- 3. Verify what actually landed. ---
  const stillNullBankId = await cardsCol.countDocuments({ bankId: null });
  const stillNetworkName = await cardsCol.countDocuments({
    bankName: { $in: [...NETWORKS] },
  });
  const withNetwork = await cardsCol.countDocuments({ network: { $exists: true } });
  console.log("\n--- post-write ---");
  console.log("cards with null bankId:          ", stillNullBankId);
  console.log("cards whose bankName is a network:", stillNetworkName);
  console.log("cards with a network field:      ", withNetwork);

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
