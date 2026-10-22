/**
 * Thin server-side wrapper over the Cuelinks publisher API (v3).
 *
 * Deliberately not marked `server-only` so `scripts/*.ts` can import it under
 * tsx; the key is a non-public env var, so a client bundle never sees it.
 *
 * Only link conversion lives here for Phase 1. Every call is best-effort: a
 * timeout, non-2xx or malformed body returns `null` so the caller can fall
 * back to the raw destination instead of stranding the user.
 */

const BASE_URL = "https://developers.cuelinks.com/pub_api/v3";
const TIMEOUT_MS = 3000;

/** Up to five pass-through labels, echoed back on transactions as sub_id..sub_id_5. */
export interface SubIds {
  subid?: string;
  subid2?: string;
  subid3?: string;
  subid4?: string;
  subid5?: string;
}

export interface ConvertInput {
  url: string;
  channelId: number;
  subids: SubIds;
  referralUrl?: string;
}

export interface ConvertResult {
  trackingUrl: string;
  // False when there is no campaign for the URL, the campaign is paused, or
  // our account lacks access. The tracking URL still redirects, it just earns
  // nothing, so callers treat `false` as "try the next candidate".
  affiliated: boolean;
  campaignId: number | null;
}

interface ConvertResponse {
  data?: {
    tracking_url?: string;
    affiliated?: boolean;
    campaign?: { id: number; name: string } | null;
  };
}

/** A row of `GET /transactions`, as documented. Amounts are decimal strings. */
export interface ApiTransaction {
  id: number;
  campaign_id: number | null;
  campaign_name: string | null;
  campaign_type: string | null;
  transaction_date: string | null;
  status: string;
  sale_amount: string | null;
  currency: string | null;
  user_commission: string | null;
  order_id: string | null;
  merchant_reference_id: string | null;
  sub_id: string | null;
  sub_id_2: string | null;
  sub_id_3: string | null;
  sub_id_4: string | null;
  sub_id_5: string | null;
  updated_at: string | null;
  [key: string]: unknown;
}

export interface TransactionsPage {
  data: ApiTransaction[];
  nextPage: number | null;
}

/**
 * One page of transactions changed after `updatedSince`, oldest change first.
 * Throws on failure: the sync must not advance its cursor past a page it
 * never read.
 */
export async function listTransactions(
  updatedSince: Date,
  page: number,
): Promise<TransactionsPage> {
  const apiKey = process.env.CUELINKS_API_KEY;
  if (!apiKey) throw new Error("CUELINKS_API_KEY is not set");

  const params = new URLSearchParams({
    updated_since: updatedSince.toISOString(),
    sort: "updated_at",
    order: "asc",
    per_page: "500",
    page: String(page),
  });
  const res = await fetch(`${BASE_URL}/transactions?${params}`, {
    headers: { Authorization: `Token ${apiKey}` },
    signal: AbortSignal.timeout(20000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Cuelinks transactions: HTTP ${res.status}`);
  const body = (await res.json()) as {
    data?: ApiTransaction[];
    meta?: { next_page?: number | null };
  };
  return { data: body.data ?? [], nextPage: body.meta?.next_page ?? null };
}

/** A row of `GET /offers`, as documented. */
export interface ApiOffer {
  id: number;
  title: string;
  description: string | null;
  terms: string | null;
  coupon_code: string | null;
  offer_type: "coupon" | "deal";
  campaign_id: number;
  campaign_name: string;
  tracking_url: string | null;
  start_date: string | null;
  end_date: string | null;
  original_price: number | null;
  discount_price: number | null;
  percent_off: number | null;
}

/**
 * Every offer valid today for one campaign. Throws on failure so the refresh
 * can tell "campaign has no offers" apart from "we couldn't ask", and keep the
 * campaign's existing offers in the second case.
 */
export async function listOffers(campaignId: number): Promise<ApiOffer[]> {
  const apiKey = process.env.CUELINKS_API_KEY;
  if (!apiKey) throw new Error("CUELINKS_API_KEY is not set");

  const all: ApiOffer[] = [];
  for (let page = 1; page <= 20; page++) {
    const params = new URLSearchParams({
      campaign_id: String(campaignId),
      per_page: "500",
      page: String(page),
    });
    const res = await fetch(`${BASE_URL}/offers?${params}`, {
      headers: { Authorization: `Token ${apiKey}` },
      signal: AbortSignal.timeout(15000),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Cuelinks offers ${campaignId}: HTTP ${res.status}`);
    const body = (await res.json()) as {
      data?: ApiOffer[];
      meta?: { next_page?: number | null };
    };
    all.push(...(body.data ?? []));
    if (!body.meta?.next_page) break;
  }
  return all;
}

export async function convertLink({
  url,
  channelId,
  subids,
  referralUrl,
}: ConvertInput): Promise<ConvertResult | null> {
  const apiKey = process.env.CUELINKS_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(`${BASE_URL}/links/convert`, {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        channel_id: channelId,
        ...subids,
        ...(referralUrl ? { referral_url: referralUrl } : {}),
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) return null;

    const body = (await res.json()) as ConvertResponse;
    const trackingUrl = body.data?.tracking_url;
    if (!trackingUrl) return null;

    return {
      trackingUrl,
      affiliated: body.data?.affiliated === true,
      campaignId: body.data?.campaign?.id ?? null,
    };
  } catch {
    return null;
  }
}
