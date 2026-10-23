import { createHash } from "crypto";
import AffiliateLinkCache from "@/models/AffiliateLinkCache";
import type { LinkNetwork } from "@/types/link";
import type { OutboundStep } from "@/models/OutboundClick";
import { convertLink, type ConvertResult, type SubIds } from "./client";

/**
 * Picks where an outbound click should land, best-earning first.
 *
 * The ladder, for one ordered list of candidate URLs:
 *   1. any `direct` candidate Cuelinks reports as affiliated   → "cuelinks"
 *   2. a pre-made Cuelinks link, redirected as-is              → "cuelinks_static"
 *   3. a GroMo link, redirected as-is                          → "gromo"
 *   4. another network's link, redirected as-is                → "partner"
 *   5. the first `direct` candidate, raw                        → "direct"
 * Cuelinks deliberately outranks the other networks: a card on several goes
 * through Cuelinks. Callers add their own last resorts (bank site, internal).
 */

const AFFILIATED_TTL_MS = 7 * 24 * 60 * 60 * 1000;
// Short, because "not affiliated" flips the moment a campaign or channel is
// approved, and a week of lost commission is the expensive mistake here.
const UNAFFILIATED_TTL_MS = 60 * 60 * 1000;

export interface Resolution {
  step: OutboundStep;
  destination: string;
  redirectUrl: string;
  /** True when the click earns commission through some network. */
  affiliated: boolean;
  campaignId: number | null;
  /** Merchant the click went to, when the caller can't infer it from the id (offers). */
  merchant?: string | null;
}

export interface Candidate {
  url: string;
  network?: LinkNetwork;
}

/**
 * Coerces stored URLs into something fetchable. Admin-entered rows include
 * scheme-less hosts ("sales.gromo.in/…") and, in one case, a card name; the
 * first is repaired, the second rejected.
 */
export function normalizeUrl(raw: string | null | undefined): string | null {
  const s = raw?.trim();
  if (!s || /\s/.test(s)) return null;
  const withScheme = /^https?:\/\//i.test(s) ? s : `https://${s}`;
  try {
    const u = new URL(withScheme);
    if (!u.hostname.includes(".")) return null;
    return u.toString();
  } catch {
    return null;
  }
}

/** Explicit `network` wins; otherwise classify by hostname. */
export function linkNetwork(candidate: Candidate): LinkNetwork {
  if (candidate.network) return candidate.network;
  let host = "";
  try {
    host = new URL(candidate.url).hostname.toLowerCase();
  } catch {
    return "direct";
  }
  const on = (domain: string) => host === domain || host.endsWith(`.${domain}`);
  if (on("gromo.in")) return "gromo";
  // Not to be confused with Cuelinks' own linksredirect.com below.
  if (on("bitli.in") || on("linkredirect.in")) return "other";
  if (on("clnk.in") || on("linksredirect.com")) return "cuelinks";
  return "direct";
}

function cacheKey(url: string, channelId: number, subids: SubIds): string {
  return createHash("sha1")
    .update(JSON.stringify([url, channelId, subids]))
    .digest("hex");
}

/** `convertLink` behind the Mongo cache. Returns null when conversion is unavailable. */
export async function cachedConvert(
  url: string,
  channelId: number | undefined,
  subids: SubIds,
): Promise<ConvertResult | null> {
  if (!channelId) return null;
  const key = cacheKey(url, channelId, subids);

  const hit = await AffiliateLinkCache.findOne({
    key,
    expiresAt: { $gt: new Date() },
  }).lean<{ trackingUrl: string; affiliated: boolean; campaignId: number | null } | null>();
  if (hit) {
    return {
      trackingUrl: hit.trackingUrl,
      affiliated: hit.affiliated,
      campaignId: hit.campaignId,
    };
  }

  const result = await convertLink({ url, channelId, subids });
  if (!result) return null;

  const ttl = result.affiliated ? AFFILIATED_TTL_MS : UNAFFILIATED_TTL_MS;
  await AffiliateLinkCache.updateOne(
    { key },
    { $set: { ...result, expiresAt: new Date(Date.now() + ttl) } },
    { upsert: true },
  ).catch(() => {
    // A failed cache write only costs a repeat API call next time.
  });
  return result;
}

export type Converter = (
  url: string,
  channelId: number | undefined,
  subids: SubIds,
) => Promise<ConvertResult | null>;

/**
 * Runs the ladder over `candidates`; null when none is usable. `convert` is
 * injectable so the coverage script can run the exact same ladder without
 * writing to the cache.
 */
export async function resolveCandidates(
  candidates: Candidate[],
  channelId: number | undefined,
  subids: SubIds,
  convert: Converter = cachedConvert,
): Promise<Resolution | null> {
  const usable = candidates
    .map((c) => {
      const url = normalizeUrl(c.url);
      return url ? { url, network: linkNetwork({ ...c, url }) } : null;
    })
    .filter((c): c is { url: string; network: LinkNetwork } => c !== null);

  const direct = usable.filter((c) => c.network === "direct");

  // Converted in parallel: a cold click with several candidates costs one
  // round trip rather than one per candidate.
  const converted = await Promise.all(
    direct.map((c) => convert(c.url, channelId, subids)),
  );
  const hit = converted.findIndex((r) => r?.affiliated);
  if (hit !== -1) {
    const r = converted[hit]!;
    return {
      step: "cuelinks",
      destination: direct[hit].url,
      redirectUrl: r.trackingUrl,
      affiliated: true,
      campaignId: r.campaignId,
    };
  }

  // Pre-made Cuelinks links can't carry our sub IDs but presumably still earn,
  // so they rank above GroMo. The link cleanup script retires these.
  const staticCl = usable.find((c) => c.network === "cuelinks");
  if (staticCl) {
    return {
      step: "cuelinks_static",
      destination: staticCl.url,
      redirectUrl: staticCl.url,
      affiliated: true,
      campaignId: null,
    };
  }

  const gromo = usable.find((c) => c.network === "gromo");
  if (gromo) {
    return {
      step: "gromo",
      destination: gromo.url,
      redirectUrl: gromo.url,
      affiliated: true,
      campaignId: null,
    };
  }

  const partner = usable.find((c) => c.network === "other");
  if (partner) {
    return {
      step: "partner",
      destination: partner.url,
      redirectUrl: partner.url,
      affiliated: true,
      campaignId: null,
    };
  }

  if (direct.length) {
    return {
      step: "direct",
      destination: direct[0].url,
      redirectUrl: direct[0].url,
      affiliated: false,
      campaignId: null,
    };
  }

  return null;
}
