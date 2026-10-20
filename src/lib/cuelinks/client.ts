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
