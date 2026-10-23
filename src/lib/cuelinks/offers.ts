import LiveOffer from "@/models/LiveOffer";
import Portal from "@/models/Portal";
import { SYNC_KEYS, touchSyncState } from "@/models/SyncState";
import { listOffers, type ApiOffer } from "./client";
import { normalizeUrl } from "./resolve";

/**
 * Daily refresh of `LiveOffer` from Cuelinks, for every active portal mapped
 * to a campaign (`Portal.campaignId`, set by scripts/cuelinks-map-portals.ts).
 *
 * Per campaign the stored offers are replaced by what Cuelinks returns today.
 * A campaign whose fetch fails keeps yesterday's offers rather than going
 * blank, but expired offers are always removed. Callers must have connected.
 */

const CONCURRENCY = 6;

export interface OffersRefreshResult {
  campaigns: number;
  failed: number;
  upserted: number;
  removed: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const startOfToday = () => new Date(Math.floor(Date.now() / DAY_MS) * DAY_MS);

function toDate(v: string | null): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** End dates are calendar days: an offer ending "2026-10-31" is valid all that day. */
function endOfDay(v: string | null): Date | null {
  const d = toDate(v);
  return d ? new Date(d.getTime() + DAY_MS - 1) : null;
}

/** The merchant URL inside Cuelinks' tracking link (`…?url=<encoded>`). */
export function landingUrlOf(trackingUrl: string | null): string | null {
  if (!trackingUrl) return null;
  try {
    return normalizeUrl(new URL(trackingUrl).searchParams.get("url"));
  } catch {
    return null;
  }
}

// Cuelinks sometimes puts prose in the code field ("Deal Activated"). A real
// code is one token; anything else is treated as a code-less deal.
const CODE_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{2,30}$/;

// Card-issuer deals ("12.5% off with HSBC Credit Cards") only apply to that
// issuer's cards, so the UI labels them rather than implying they stack with
// whichever card we suggested. Longer names first so "Bank of Baroda" wins
// over a bare "BOB".
const BANKS: [RegExp, string][] = [
  [/\bamerican express\b|\bamex\b/i, "American Express"],
  [/\bbank of baroda\b|\bbob(card)?\b/i, "Bank of Baroda"],
  [/\bstandard chartered\b/i, "Standard Chartered"],
  [/\bau (small finance )?bank\b/i, "AU Bank"],
  [/\byes bank\b/i, "YES Bank"],
  [/\bhdfc\b/i, "HDFC"],
  [/\bicici\b/i, "ICICI"],
  [/\bsbi\b/i, "SBI"],
  [/\baxis\b/i, "Axis"],
  [/\bkotak\b/i, "Kotak"],
  [/\bhsbc\b/i, "HSBC"],
  [/\bidfc\b/i, "IDFC FIRST"],
  [/\bindusind\b/i, "IndusInd"],
  [/\brbl\b/i, "RBL"],
  [/\bfederal bank\b/i, "Federal Bank"],
  [/\bonecard\b/i, "OneCard"],
  [/\bciti(bank)?\b/i, "Citi"],
];

export function dealBank(title: string, description: string | null): string | null {
  const text = `${title} ${description ?? ""}`;
  return BANKS.find(([re]) => re.test(text))?.[1] ?? null;
}

function toDoc(o: ApiOffer, portalSlugs: string[], now: Date) {
  const code = o.coupon_code?.trim();
  const couponCode = code && CODE_RE.test(code) ? code : null;
  return {
    offerId: o.id,
    campaignId: o.campaign_id,
    portalSlugs,
    title: o.title?.trim() || "Offer",
    description: o.description?.trim() || null,
    terms: o.terms?.trim() || null,
    couponCode,
    offerType: couponCode ? "coupon" : "deal",
    percentOff: o.percent_off ?? null,
    originalPrice: o.original_price ?? null,
    discountPrice: o.discount_price ?? null,
    startDate: toDate(o.start_date),
    endDate: endOfDay(o.end_date),
    landingUrl: landingUrlOf(o.tracking_url),
    bank: dealBank(o.title ?? "", o.description),
    refreshedAt: now,
  };
}

async function pool<T>(items: T[], limit: number, fn: (t: T) => Promise<void>) {
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) await fn(items[next++]);
    }),
  );
}

export async function refreshOffers(): Promise<OffersRefreshResult> {
  const now = new Date();
  const portals = await Portal.find(
    { status: "active", campaignId: { $ne: null } },
    "slug campaignId",
  ).lean<{ slug: string; campaignId: number }[]>();

  const slugsByCampaign = new Map<number, string[]>();
  for (const p of portals) {
    const list = slugsByCampaign.get(p.campaignId) ?? [];
    list.push(p.slug);
    slugsByCampaign.set(p.campaignId, list);
  }

  let failed = 0;
  let upserted = 0;
  let removed = 0;

  await pool([...slugsByCampaign.entries()], CONCURRENCY, async ([campaignId, slugs]) => {
    let offers: ApiOffer[];
    try {
      offers = await listOffers(campaignId);
    } catch (err) {
      failed++;
      console.error("[offers] fetch failed", campaignId, err);
      return;
    }
    const live = offers.filter((o) => {
      const end = endOfDay(o.end_date);
      return !end || end >= now;
    });
    if (live.length) {
      const res = await LiveOffer.bulkWrite(
        live.map((o) => ({
          updateOne: {
            filter: { offerId: o.id },
            update: { $set: toDoc(o, slugs, now) },
            upsert: true,
          },
        })),
      );
      upserted += res.upsertedCount + res.modifiedCount;
    }
    const gone = await LiveOffer.deleteMany({
      campaignId,
      offerId: { $nin: live.map((o) => o.id) },
    });
    removed += gone.deletedCount;
  });

  // Expired offers go regardless of fetch success; so do offers for campaigns
  // no portal is mapped to any more.
  const expired = await LiveOffer.deleteMany({
    $or: [
      { endDate: { $lt: startOfToday() } },
      { campaignId: { $nin: [...slugsByCampaign.keys()] } },
    ],
  });
  removed += expired.deletedCount;

  const result = { campaigns: slugsByCampaign.size, failed, upserted, removed };
  await touchSyncState(SYNC_KEYS.offers, { lastResult: { ...result, ok: failed === 0 } });
  return result;
}
