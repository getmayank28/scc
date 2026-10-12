// Resolving a card to its bank's voucher portal ("ICICI iShop", "Smartbuy
// Instant Voucher", …), so the spend optimizer can name the place a voucher is
// actually bought instead of saying "your bank portal".
//
// Why this joins on the SLUG and not `card.bankId`:
// `bankId` is null on every card in the collection (0 of 373 at the time of
// writing) and `bankName` holds the NETWORK ("mastercard", "rupay"), not the
// issuer — which is why the card header renders "MASTERCARD". The existing
// giftor lookup (`/api/admin/giftors/[id]`) queries `Giftor.find({ bankId:
// card.bankId })` and therefore matches nothing for any card; the voucher CTA
// has been falling through to its "no voucher partner listed" toast.
//
// Card slugs end with the slugified issuer name (`…-icici-bank`, `…-hdfc-bank`),
// so a suffix match recovers the bank for 100% of active cards. That is the
// only linkage the data currently supports.

import dbConnect from "@/lib/utils/dbConnet";
import BankModel from "@/models/Bank";
import GiftorModel from "@/models/Giftor";

export interface VoucherPortal {
  name: string;
  url: string;
}

/** Slugify a bank name the same way card slugs were built. */
function slugifyBank(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Bank names whose slug doesn't appear verbatim at the end of their cards'
// slugs. SBI is the only one: the bank is "SBI" but its cards end `-sbi-card`
// (`simplyclick-sbi-card-sbi-card`) or `-sbi` (`reliance-sbi-card-sbi`). Both
// forms are tried, longest first, so a card ending `-sbi-card` never matches a
// shorter bank slug by accident.
const EXTRA_SUFFIXES: Record<string, string[]> = {
  sbi: ["sbi-card", "sbi"],
};

interface BankSuffix {
  suffix: string;
  bankId: string;
}

// Bank suffixes are derived from at most ~18 bank rows and change effectively
// never, so they're built once per process rather than per request.
let suffixCache: BankSuffix[] | null = null;
let portalCache: Map<string, VoucherPortal> | null = null;

async function load(): Promise<{
  suffixes: BankSuffix[];
  portals: Map<string, VoucherPortal>;
}> {
  if (suffixCache && portalCache) {
    return { suffixes: suffixCache, portals: portalCache };
  }

  await dbConnect();
  const [banks, giftors] = await Promise.all([
    BankModel.find({}).select("name").lean<{ _id: unknown; name: string }[]>(),
    GiftorModel.find({ type: "voucher" })
      .select("name url bankId")
      .lean<{ name: string; url: string; bankId: unknown }[]>(),
  ]);

  const portals = new Map<string, VoucherPortal>();
  for (const g of giftors) {
    const key = String(g.bankId);
    // First giftor per bank wins; banks have at most one voucher portal today.
    if (!portals.has(key) && g.name && g.url) {
      portals.set(key, { name: g.name, url: g.url });
    }
  }

  const suffixes: BankSuffix[] = [];
  for (const b of banks) {
    const base = slugifyBank(b.name);
    const forms = EXTRA_SUFFIXES[base] ?? [base];
    for (const f of forms) suffixes.push({ suffix: f, bankId: String(b._id) });
  }
  // Longest suffix first: "sbi-card" must be tested before "sbi", and a bank
  // whose name is a suffix of another's must not win the shorter match.
  suffixes.sort((a, b) => b.suffix.length - a.suffix.length);

  suffixCache = suffixes;
  portalCache = portals;
  return { suffixes, portals };
}

/**
 * The voucher portal for each of `cardSlugs`, keyed by slug. Slugs whose bank
 * has no giftor on file are simply absent — the caller falls back to generic
 * copy rather than naming a portal that doesn't exist.
 */
export async function voucherPortalsForCards(
  cardSlugs: string[],
): Promise<Record<string, VoucherPortal>> {
  if (cardSlugs.length === 0) return {};

  const { suffixes, portals } = await load();
  const out: Record<string, VoucherPortal> = {};

  for (const slug of cardSlugs) {
    const hit = suffixes.find((s) => slug.endsWith(`-${s.suffix}`));
    if (!hit) continue;
    const portal = portals.get(hit.bankId);
    if (portal) out[slug] = portal;
  }

  return out;
}
