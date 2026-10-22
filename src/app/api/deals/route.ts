import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import dbConnect from "@/lib/utils/dbConnet";
import { ApiResponse } from "@/lib/utils/ApiResponse";
import LiveOffer, { type LiveOfferProps } from "@/models/LiveOffer";
import Portal from "@/models/Portal";
import { bestCardsFor, walletCards } from "@/lib/deals/bestCard";
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
  return {
    offerId: o.offerId,
    title: o.title,
    description: o.description,
    terms: o.terms,
    couponCode: o.couponCode,
    percentOff: o.percentOff,
    endDate: o.endDate ? o.endDate.toISOString() : null,
    bank: o.bank ?? null,
  };
}

// Codes first (they're what people come for), then the biggest stated
// discount, then whatever ends soonest.
function byUsefulness(a: LiveOfferProps, b: LiveOfferProps): number {
  if (!!a.couponCode !== !!b.couponCode) return a.couponCode ? -1 : 1;
  const pa = a.percentOff ?? -1;
  const pb = b.percentOff ?? -1;
  if (pa !== pb) return pb - pa;
  return (a.endDate?.getTime() ?? Infinity) - (b.endDate?.getTime() ?? Infinity);
}

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

    const merchants: MerchantDeals[] = portals
      .map((p) => ({
        portalSlug: p.slug,
        merchantName: p.name,
        bestCard: best.get(p.slug) ?? null,
        deals: (bySlug.get(p.slug) ?? []).sort(byUsefulness).map(toDeal),
      }))
      .sort((a, b) => b.deals.length - a.deals.length);

    const body: DealsResponse = { merchants, walletEmpty: withCards && cards.length === 0 };
    return ApiResponse.success("ok", 200, body);
  } catch (err) {
    console.error("[/api/deals] failed:", err);
    return ApiResponse.error("Couldn't load deals", 500);
  }
}
