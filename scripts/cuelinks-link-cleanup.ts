/**
 * Prepare `links` and `banks` for `/api/out` (Cuelinks Phase 1).
 *
 * WHAT IT FIXES
 *
 *   1. Pre-made Cuelinks links (clnk.in / linksredirect.com) are unwrapped to
 *      the merchant URL inside them. As stored they can't carry our sub IDs,
 *      and they were attributed to the wrong channels: most to cid 260264,
 *      which is not one of this account's channels, the rest to the Instagram
 *      channel. Unwrapped, `/api/out` re-converts them on the right channel.
 *   2. tinyurl links are followed to their destination for the same reason.
 *   3. Scheme-less URLs ("sales.gromo.in/…") get `https://`.
 *   4. Every row gets an explicit `network`, and `campaignId` where the URL is
 *      a known Cuelinks campaign landing page.
 *   5. Card-specific Cuelinks campaigns (CARD_CAMPAIGNS) and bank-wide ones
 *      (BANK_CAMPAIGNS) get a link row at priority 0 when missing. Card
 *      campaigns forbid deep links, so the row must be the campaign's own URL.
 *      These outrank GroMo and other networks on the ladder.
 *   6. `banks.website` is filled where empty, after checking the URL responds.
 *      This is the card fallback that replaced the LinkedIn page.
 *
 * Rows are never deleted. bitli.in links (another network, via
 * linkredirect.in) and GroMo links are kept as they are, as lower rungs.
 *
 * SAFETY
 *
 * Dry run by default — prints every change and writes nothing. `--commit`
 * applies, after writing a JSON backup of `links` and `banks` to
 * `--backup=<path>` (default ./cuelinks-backup-<timestamp>.json). A prod
 * database also needs `--yes-prod`. Idempotent: a second run is a no-op.
 *
 *   npx tsx --env-file=.env.local scripts/cuelinks-link-cleanup.ts
 *   npx tsx --env-file=.env.local scripts/cuelinks-link-cleanup.ts --commit --yes-prod
 */

import fs from "fs";
import mongoose from "mongoose";
import { normalizeUrl } from "../src/lib/cuelinks/resolve";
import type { LinkNetwork } from "../src/types/link";
import {
  classify,
  dbGuard,
  fetchIndiaCampaigns,
  isShortLink,
  pool,
  unwrap,
  type Campaign,
} from "./cuelinks-shared";

/** Card-specific campaigns → the card slugs they cover. */
const CARD_CAMPAIGNS: { campaignId: number; slug: RegExp }[] = [
  { campaignId: 7656, slug: /^tata-neu-.*-hdfc-bank$/ }, // Tata Neu HDFC
  { campaignId: 5507, slug: /^hdfc-swiggy-/ }, // HDFC Swiggy
  { campaignId: 6232, slug: /^scapia-federal-/ }, // Federal Scapia
  { campaignId: 57531, slug: /^bobcard-etihad-guest-/ }, // BOB Etihad
  { campaignId: 8574, slug: /^yes-bank-pop-club-/ }, // YES Pop Club
  { campaignId: 6354, slug: /^cashback-sbi-card-sbi-card$/ }, // SBI Cashback
  { campaignId: 9496, slug: /^indusind-tiger-/ }, // IndusInd Bajaj Tiger
  { campaignId: 9547, slug: /^kiwi-card-/ }, // Kiwi
  { campaignId: 6158, slug: /novio/ }, // SBM Novio
  // Zagg (40253) deliberately omitted: its landing page is a PNB card, ours is
  // the YES Bank Zagg. Confirm with Cuelinks before mapping.
];

/** Bank-wide card campaigns → bank slug. Every card of the bank falls back here. */
const BANK_CAMPAIGNS: { campaignId: number; bank: string }[] = [
  { campaignId: 4800, bank: "au-bank" },
  { campaignId: 4615, bank: "axis-bank" },
  { campaignId: 4770, bank: "bank-of-baroda" },
  { campaignId: 7687, bank: "federal-bank" },
  { campaignId: 5465, bank: "hdfc-bank" },
  { campaignId: 4606, bank: "idfc-first-bank" },
  { campaignId: 4831, bank: "indusind-bank" },
  { campaignId: 6356, bank: "sbi" },
];

/** Official credit-card pages, checked for a response before being written. */
const BANK_WEBSITES: Record<string, string> = {
  "axis-bank": "https://www.axis.bank.in/cards/credit-card",
  "north-east-small-finance-bank": "https://www.slice.bank.in",
  "csb-bank": "https://www.csb.bank.in", // behind a bot wall; real browsers pass
  "icici-bank": "https://www.icici.bank.in/personal-banking/cards/credit-card",
  "kotak-mahindra-bank": "https://www.kotak.bank.in/en/personal-banking/cards/credit-cards.html",
  "federal-bank": "https://www.federal.bank.in/credit-cards",
  "idfc-first-bank": "https://www.idfcfirst.bank.in/credit-card",
  "rbl-bank": "https://www.rbl.bank.in/personal-banking/cards/credit-cards",
  "sbm-bank-india": "https://www.sbmbank.co.in",
  sbi: "https://www.sbicard.com",
  "au-bank": "https://www.au.bank.in/credit-cards",
  "american-express": "https://www.americanexpress.com/in/",
  "yes-bank": "https://www.yes.bank.in/personal-banking/cards/credit-cards",
  "indusind-bank": "https://www.indusind.bank.in/in/en/personal/cards/credit-card.html",
  "bank-of-baroda": "https://www.bobcard.co.in/",
  "hdfc-bank": "https://www.hdfc.bank.in/credit-cards",
  "hsbc-bank": "https://www.hsbc.co.in/credit-cards/",
  "standard-chartered-bank": "https://www.sc.com/in/credit-cards/",
};

/**
 * Sites that block Node's fetch (TLS fingerprinting) but load in a browser and
 * in curl — checked by hand on 2026-10-20, so the reachability probe is skipped.
 */
const VERIFIED_BY_HAND = new Set(["bank-of-baroda", "american-express"]);

interface LinkRow {
  _id: mongoose.Types.ObjectId;
  url: string;
  cardId?: mongoose.Types.ObjectId;
  bankId?: mongoose.Types.ObjectId;
  network?: LinkNetwork;
  campaignId?: number;
}

/** Same page, ignoring scheme, `www.`, trailing slash and fragment. */
function pageKey(url: string): string {
  try {
    const u = new URL(url);
    return `${u.hostname.replace(/^www\./, "")}${u.pathname.replace(/\/$/, "")}${u.search}`.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

// Several bank sites drop connections from bare user agents.
const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

/**
 * Reachable means the server answered. Bank sites routinely 403 non-browser
 * clients, so any HTTP status below 404 counts; DNS and network errors don't.
 */
async function reachable(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
      headers: { "user-agent": BROWSER_UA },
    });
    return res.status < 404;
  } catch {
    return false;
  }
}

async function main() {
  const commit = process.argv.includes("--commit");
  await mongoose.connect(process.env.MONGODB_URI!);
  const db = mongoose.connection.db!;
  dbGuard(db.databaseName, commit);

  const linksCol = db.collection<LinkRow>("links");
  const banksCol = db.collection("banks");
  const cardsCol = db.collection("cards");

  const campaigns = await fetchIndiaCampaigns();
  const byId = new Map<number, Campaign>(campaigns.map((c) => [c.id, c]));
  const campaignByPage = new Map<string, number>();
  // Card-specific first so a shared landing page is attributed to the
  // narrower campaign only where we map it explicitly below.
  for (const { campaignId } of [...BANK_CAMPAIGNS, ...CARD_CAMPAIGNS]) {
    const c = byId.get(campaignId);
    if (c?.url && !campaignByPage.has(pageKey(c.url))) campaignByPage.set(pageKey(c.url), campaignId);
  }

  const links = await linksCol.find({}).toArray();
  const banks = await banksCol.find({}).toArray();

  // ---- 1-4: repair existing rows -----------------------------------------
  const updates: { _id: mongoose.Types.ObjectId; set: Partial<LinkRow>; note: string }[] = [];
  const unresolvable: string[] = [];

  const shortOnes = links.filter((l) => {
    const u = normalizeUrl(l.url);
    return u && isShortLink(u);
  });
  const unwrapped = new Map(
    (await pool(shortOnes, 6, (l) => unwrap(normalizeUrl(l.url)!))).map((u) => [u.original, u]),
  );

  for (const l of links) {
    let url = normalizeUrl(l.url);
    if (!url) {
      unresolvable.push(`${l._id} ${JSON.stringify(l.url)}`);
      continue;
    }
    let note = url !== l.url ? "scheme repaired" : "";

    if (isShortLink(url)) {
      const u = unwrapped.get(url);
      const dest = normalizeUrl(u?.destination);
      if (dest) {
        note = `unwrapped${u?.cid ? ` (was cid ${u.cid})` : ""}`;
        url = dest;
      } else {
        unresolvable.push(`${l._id} ${l.url} (short link did not resolve; left as is)`);
      }
    }

    const { network } = classify(url);
    const campaignId = campaignByPage.get(pageKey(url));
    const set: Partial<LinkRow> = {};
    if (url !== l.url) set.url = url;
    if (network && network !== l.network) set.network = network;
    // Only fill a missing id: HDFC's generic and Swiggy campaigns share a
    // landing page, so an explicitly mapped row must not be relabelled.
    if (campaignId && !l.campaignId) set.campaignId = campaignId;
    if (Object.keys(set).length) updates.push({ _id: l._id, set, note });
  }

  // ---- 5: campaign rows ---------------------------------------------------
  // Compare against the repaired URLs so a just-unwrapped row counts as present.
  const finalUrl = new Map(links.map((l) => [String(l._id), l.url]));
  for (const u of updates) if (u.set.url) finalUrl.set(String(u._id), u.set.url);
  const has = (filter: (l: LinkRow) => boolean, url: string) =>
    links.some((l) => filter(l) && pageKey(finalUrl.get(String(l._id)) ?? "") === pageKey(url));

  const inserts: Record<string, unknown>[] = [];
  const skipped: string[] = [];
  const now = new Date();
  const row = (campaign: Campaign, owner: Record<string, unknown>) => ({
    ...owner,
    url: campaign.url,
    type: "affiliate",
    network: "direct",
    campaignId: campaign.id,
    priority: 0,
    active: true,
    createdAt: now,
    updatedAt: now,
  });

  for (const { campaignId, slug } of CARD_CAMPAIGNS) {
    const c = byId.get(campaignId);
    if (!c || c.access_status !== "open") {
      skipped.push(`campaign ${campaignId}: ${c ? c.access_status : "not found"}`);
      continue;
    }
    const cards = await cardsCol.find({ slug: slug }, { projection: { slug: 1 } }).toArray();
    for (const card of cards) {
      if (has((l) => String(l.cardId) === String(card._id), c.url)) continue;
      inserts.push({ ...row(c, { cardId: card._id }), _slug: card.slug, _campaign: c.name });
    }
  }
  for (const { campaignId, bank: bankSlug } of BANK_CAMPAIGNS) {
    const c = byId.get(campaignId);
    const bank = banks.find((b) => b.slug === bankSlug);
    if (!c || c.access_status !== "open" || !bank) {
      skipped.push(`campaign ${campaignId} / ${bankSlug}: ${!bank ? "bank missing" : c ? c.access_status : "not found"}`);
      continue;
    }
    if (has((l) => !l.cardId && String(l.bankId) === String(bank._id), c.url)) continue;
    inserts.push({ ...row(c, { bankId: bank._id }), _slug: bankSlug, _campaign: c.name });
  }

  // ---- 6: bank websites ---------------------------------------------------
  const siteSets: { _id: mongoose.Types.ObjectId; slug: string; website: string }[] = [];
  const siteFails: string[] = [];
  await pool(
    banks.filter((b) => !b.website && BANK_WEBSITES[b.slug]),
    6,
    async (b) => {
      const candidate = BANK_WEBSITES[b.slug];
      const origin = new URL(candidate).origin;
      const ok = VERIFIED_BY_HAND.has(b.slug) || (await reachable(candidate))
        ? candidate
        : (await reachable(origin))
          ? origin
          : null;
      if (ok) siteSets.push({ _id: b._id, slug: b.slug, website: ok });
      else siteFails.push(`${b.slug}: ${candidate} unreachable`);
    },
  );

  // ---- report --------------------------------------------------------------
  console.log(`\nLink rows to update: ${updates.length}`);
  for (const u of updates) {
    const l = links.find((x) => x._id.equals(u._id))!;
    console.log(`  ${u._id}  ${l.url}`);
    console.log(`      → ${JSON.stringify(u.set)}${u.note ? `  [${u.note}]` : ""}`);
  }
  console.log(`\nCampaign link rows to add: ${inserts.length}`);
  for (const i of inserts) console.log(`  ${String(i._slug).padEnd(56)} ${i._campaign}  ${i.url}`);
  console.log(`\nBank websites to set: ${siteSets.length}`);
  for (const s of siteSets) console.log(`  ${s.slug.padEnd(32)} ${s.website}`);
  if (siteFails.length) console.log(`  not set:\n    ${siteFails.join("\n    ")}`);
  if (skipped.length) console.log(`\nSkipped campaigns:\n  ${skipped.join("\n  ")}`);
  if (unresolvable.length) console.log(`\nLeft untouched:\n  ${unresolvable.join("\n  ")}`);

  if (!commit) {
    console.log("\nDry run — nothing written. Re-run with --commit to apply.");
    await mongoose.disconnect();
    return;
  }

  const backup =
    process.argv.find((a) => a.startsWith("--backup="))?.slice(9) ??
    `cuelinks-backup-${Date.now()}.json`;
  fs.writeFileSync(backup, JSON.stringify({ db: db.databaseName, links, banks }, null, 2));
  console.log(`\nBackup written to ${backup}`);

  for (const u of updates) {
    await linksCol.updateOne({ _id: u._id }, { $set: { ...u.set, updatedAt: now } });
  }
  if (inserts.length) {
    await linksCol.insertMany(
      inserts.map(({ _slug, _campaign, ...doc }) => {
        void _slug;
        void _campaign;
        return doc as unknown as LinkRow;
      }),
    );
  }
  for (const s of siteSets) {
    await banksCol.updateOne({ _id: s._id }, { $set: { website: s.website } });
  }
  console.log(
    `Committed: ${updates.length} updated, ${inserts.length} inserted, ${siteSets.length} bank websites set.`,
  );
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
