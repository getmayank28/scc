import { cached } from "@/models/ReportCache";
import { listIndiaCampaigns, type ApiCampaign } from "@/lib/cuelinks/client";
import type { CampaignRef, UnearnedReason } from "@/types/affiliateReport";

/**
 * Why a link doesn't earn, from where it actually sends people. Shared by the
 * Phase 4 report ("clicks that didn't earn") and the link-health check, so
 * both explain the same link the same way.
 */

const CAMPAIGNS_TTL_MS = 6 * 60 * 60 * 1000;

// Suffixes many unrelated sites share. Cuelinks files several banks' card
// campaigns under the domain "bank.in" (AU, Axis, HDFC…), so matching on it
// would pin yes.bank.in on AU's campaign. Never match at or above these.
const SHARED_SUFFIXES = new Set(["bank.in", "co.in", "net.in", "org.in", "gov.in", "ac.in", "in", "com", "co", "net", "org"]);

export const NEEDS_ACCESS = new Set(["not_applied", "pending"]);

export const hostOf = (u: string | null | undefined) => {
  try {
    return u ? new URL(u).hostname.replace(/^www\./, "").toLowerCase() : null;
  } catch {
    return null;
  }
};

export interface CampaignIndex {
  byDomain: Map<string, ApiCampaign[]>;
  byId: Map<number, ApiCampaign>;
}

/** India campaigns, indexed by domain and id. Empty (not thrown) when Cuelinks is unreachable. */
export async function loadCampaignIndex(): Promise<CampaignIndex> {
  let campaigns: ApiCampaign[] = [];
  try {
    campaigns = await cached("campaigns:IN", CAMPAIGNS_TTL_MS, listIndiaCampaigns);
  } catch (err) {
    // Reasons degrade to "no_campaign"; callers still render.
    console.error("[affiliate reasons] campaign list unavailable", err);
  }
  const byDomain = new Map<string, ApiCampaign[]>();
  const byId = new Map<number, ApiCampaign>();
  for (const c of campaigns) {
    byId.set(c.id, c);
    // A campaign filed under a shared suffix is indexed by its landing host
    // instead (HDFC's "bank.in" campaign → applyonline.hdfc.bank.in).
    const listed = (c.domain || "").replace(/^www\./, "").toLowerCase();
    const d = listed && !SHARED_SUFFIXES.has(listed) ? listed : hostOf(c.url);
    if (d) byDomain.set(d, [...(byDomain.get(d) ?? []), c]);
  }
  return { byDomain, byId };
}

/**
 * Campaign for a host: exact domain first, then parent domains short of a
 * shared suffix.
 *
 * One domain often carries several campaigns — ajio.com has the main store
 * (www.ajio.com) and Ajio Gram (ajiogram.ajio.com); flipkart.com has the store
 * and a seller sign-up page. Pick the one whose landing page is on the host the
 * click went to, then the domain's main site, and only then a sub-site.
 * Preferring "any open campaign" instead blamed main-store clicks on whichever
 * side programme we happened to have access to.
 */
export function campaignFor(host: string | null, index: CampaignIndex): ApiCampaign | null {
  if (!host) return null;
  const parts = host.split(".");
  for (let i = 0; i < parts.length - 1; i++) {
    const candidate = parts.slice(i).join(".");
    if (SHARED_SUFFIXES.has(candidate)) break;
    const options = index.byDomain.get(candidate);
    if (options?.length) {
      const fit = (c: ApiCampaign) => {
        const landing = hostOf(c.url);
        return landing === host ? 2 : landing === candidate ? 1 : 0;
      };
      return [...options].sort(
        (a, b) =>
          fit(b) - fit(a) || Number(b.access_status === "open") - Number(a.access_status === "open"),
      )[0];
    }
  }
  return null;
}

export interface Explanation {
  reason: UnearnedReason;
  host: string | null;
  campaign: CampaignRef | null;
}

/** Why a non-earning `step` to `destination` doesn't earn. */
export function explain(step: string, destination: string | null, index: CampaignIndex): Explanation {
  if (step === "internal") return { reason: "no_destination", host: null, campaign: null };
  const host = hostOf(destination);
  const c = campaignFor(host, index);
  return {
    reason: !c ? "no_campaign" : NEEDS_ACCESS.has(c.access_status) ? "needs_access" : "not_linked",
    host,
    campaign: c ? { id: c.id, name: c.name, status: c.access_status, landingHost: hostOf(c.url) } : null,
  };
}
