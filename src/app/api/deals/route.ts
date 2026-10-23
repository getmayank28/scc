import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import dbConnect from "@/lib/utils/dbConnet";
import { ApiResponse } from "@/lib/utils/ApiResponse";
import LiveOffer, { type LiveOfferProps } from "@/models/LiveOffer";
import Portal from "@/models/Portal";
import { bestCardsFor, walletCards } from "@/lib/deals/bestCard";
import { parseDiscount } from "@/lib/deals/discount";
import { dealCategory } from "@/lib/deals/categories";
import type { Deal, DealsResponse, MerchantDeals } from "@/types/deals";

export const runtime = "nodejs";

/**
 * GET /api/deals                → every merchant with live deals, each with the
 *                                 user's best card to pay with (the /deals page)
 * GET /api/deals?portal=<slug>  → one merchant's deals (the spend optimizer's
 *                                 block). Add &cards=0 to skip the card pick
 *                                 when the caller already has one.
 *
 * Deals are Cuelinks offers refreshed daily into `LiveOffer`. Links are built
 * client-side as /api/out?type=offer&id=<offerId>, never the stored URL.
 */

const SLUG_RE = /^[a-z0-9][a-z0-9._-]{0,159}$/i;

function toDeal(o: LiveOfferProps): Deal {
  const discount = parseDiscount(o.title);
  return {
    offerId: o.offerId,
    title: o.title,
    description: o.description,
    terms: o.terms,
    couponCode: o.couponCode,
    percentOff: o.percentOff ?? discount?.percent ?? null,
    discount,
    endDate: o.endDate ? o.endDate.toISOString() : null,
    bank: o.bank ?? null,
  };
}

// Codes first (they're what people come for), then the biggest stated
// discount, then whatever ends soonest.
function byUsefulness(a: Deal, b: Deal): number {
  if (!!a.couponCode !== !!b.couponCode) return a.couponCode ? -1 : 1;
  const pa = a.percentOff ?? -1;
  const pb = b.percentOff ?? -1;
  if (pa !== pb) return pb - pa;
  const end = (d: Deal) => (d.endDate ? Date.parse(d.endDate) : Infinity);
  return end(a) - end(b);
}

// Cuelinks often lists one coupon several times with reworded titles.
function dedupe(deals: Deal[]): Deal[] {
  const seen = new Set<string>();
  return deals.filter((d) => {
    const key = d.couponCode
      ? `code:${d.couponCode.toUpperCase()}`
      : `title:${d.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Sister stores on one campaign (Tata CLiQ, Tata CLiQ Fashion, Luxe) carry the
 * exact same offers; listing them three times buries everything else. Keep the
 * one whose name prefixes the most others ("Tata CLiQ"), shortest name on ties.
 */
function foldSisters(merchants: MerchantDeals[]): MerchantDeals[] {
  const groups = new Map<string, MerchantDeals[]>();
  for (const m of merchants) {
    const key = m.deals.map((d) => d.offerId).sort((a, b) => a - b).join(",");
    groups.set(key, [...(groups.get(key) ?? []), m]);
  }
  return [...groups.values()].map((group) => {
    if (group.length === 1) return group[0];
    const prefixes = (m: MerchantDeals) =>
      group.filter((o) => o !== m && o.merchantName.toLowerCase().startsWith(m.merchantName.toLowerCase())).length;
    const [primary, ...rest] = [...group].sort(
      (a, b) => prefixes(b) - prefixes(a) || a.merchantName.length - b.merchantName.length,
    );
    return { ...primary, alsoAt: rest.map((m) => m.merchantName) };
  });
}

// "Kotak" (offer) vs "Kotak Mahindra Bank" (card): compare on the core name.
const bankKey = (name: string) =>
  name.toLowerCase().replace(/\b(bank|mahindra|cards?|ltd)\b/g, "").replace(/[^a-z]/g, "");

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?._id;
  if (!userId) return ApiResponse.error("Unauthorized", 401);

  const sp = new URL(req.url).searchParams;
  const portal = sp.get("portal");
  if (portal !== null && !SLUG_RE.test(portal)) return ApiResponse.error("Invalid portal", 400);
  const withCards = sp.get("cards") !== "0";

  try {
    await dbConnect();
    const now = new Date();
    const offers = await LiveOffer.find({
      ...(portal ? { portalSlugs: portal } : {}),
      $and: [
        { $or: [{ endDate: null }, { endDate: { $gte: now } }] },
        { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
      ],
    }).lean<LiveOfferProps[]>();

    // An offer belongs to every portal on its campaign; list it under each one
    // the caller can see (all of them, or just the requested portal).
    const bySlug = new Map<string, LiveOfferProps[]>();
    for (const o of offers) {
      for (const slug of portal ? [portal] : o.portalSlugs) {
        bySlug.set(slug, [...(bySlug.get(slug) ?? []), o]);
      }
    }

    const portals = await Portal.find(
      { slug: { $in: [...bySlug.keys()] }, status: "active" },
      "slug name portalType",
    ).lean<{ slug: string; name: string; portalType?: string }[]>();

    const cards = withCards ? await walletCards(userId) : [];
    const best = withCards
      ? await bestCardsFor(
          cards,
          portals.map((p) => ({ portalSlug: p.slug, name: p.name, portalType: p.portalType })),
        )
      : new Map();

    const merchants: MerchantDeals[] = foldSisters(
      portals.map((p) => ({
        portalSlug: p.slug,
        merchantName: p.name,
        alsoAt: [],
        category: dealCategory(p.slug, p.portalType),
        bestCard: best.get(p.slug) ?? null,
        deals: dedupe((bySlug.get(p.slug) ?? []).map(toDeal).sort(byUsefulness)),
      })),
    ).sort((a, b) => b.deals.length - a.deals.length);

    const held = new Set(cards.map((c) => bankKey(c.bankId)));
    const walletBanks = [...new Set(offers.map((o) => o.bank).filter((b): b is string => !!b))].filter((b) =>
      held.has(bankKey(b)),
    );

    const body: DealsResponse = { merchants, walletEmpty: withCards && cards.length === 0, walletBanks };
    return ApiResponse.success("ok", 200, body);
  } catch (err) {
    console.error("[/api/deals] failed:", err);
    return ApiResponse.error("Couldn't load deals", 500);
  }
}
