/**
 * Helpers shared by the Cuelinks data scripts (coverage report, link cleanup).
 * Script-only: the app itself never follows short links or lists campaigns.
 */

import { linkNetwork, normalizeUrl } from "../src/lib/cuelinks/resolve";
import type { LinkNetwork } from "../src/types/link";

const API = "https://developers.cuelinks.com/pub_api/v3";

function headers() {
  const key = process.env.CUELINKS_API_KEY;
  if (!key) throw new Error("CUELINKS_API_KEY is not set");
  return { Authorization: `Token ${key}`, "Content-Type": "application/json" };
}

export interface Campaign {
  id: number;
  name: string;
  url: string;
  domain: string;
  campaign_type: string;
  access_status: string;
  payout: string;
  payout_type: string;
  deeplink_allowed: boolean;
  sub_ids_allowed: boolean;
}

/** Every campaign running in India (country 252). */
export async function fetchIndiaCampaigns(): Promise<Campaign[]> {
  const all: Campaign[] = [];
  for (let page = 1; ; page++) {
    const res = await fetch(`${API}/campaigns?country_id=252&per_page=500&page=${page}`, {
      headers: headers(),
    });
    if (!res.ok) throw new Error(`campaigns page ${page}: HTTP ${res.status}`);
    const body = (await res.json()) as { data: Campaign[]; meta: { next_page: number | null } };
    all.push(...body.data);
    if (!body.meta.next_page) break;
  }
  return all;
}

/**
 * Where a link really leads. Cuelinks wrappers are unwrapped to the merchant
 * URL inside them (`linksredirect.com/?url=…`, reached by following `clnk.in`);
 * other short links (tinyurl) are followed to their end. `cid` is the Cuelinks
 * channel the wrapper was attributed to, when there was one.
 */
export interface Unwrapped {
  original: string;
  destination: string | null;
  cid: string | null;
  hops: string[];
}

const SHORTENER = /(^|\.)(clnk\.in|linksredirect\.com|tinyurl\.com)$/i;

export function isShortLink(url: string): boolean {
  try {
    return SHORTENER.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

function fromLinksRedirect(url: string): { destination: string | null; cid: string | null } | null {
  try {
    const u = new URL(url);
    if (!/(^|\.)linksredirect\.com$/i.test(u.hostname)) return null;
    return { destination: u.searchParams.get("url"), cid: u.searchParams.get("cid") };
  } catch {
    return null;
  }
}

export async function unwrap(original: string): Promise<Unwrapped> {
  const hops = [original];
  let current = original;
  for (let i = 0; i < 8; i++) {
    const lr = fromLinksRedirect(current);
    if (lr) return { original, ...lr, hops };
    let host = "";
    try {
      host = new URL(current).hostname;
    } catch {
      break;
    }
    if (!SHORTENER.test(host)) return { original, destination: current, cid: null, hops };

    let res: Response;
    try {
      res = await fetch(current, {
        redirect: "manual",
        signal: AbortSignal.timeout(8000),
        headers: { "user-agent": "Mozilla/5.0" },
      });
    } catch {
      break;
    }
    const loc = res.headers.get("location");
    if (!loc || res.status < 300 || res.status >= 400) break;
    current = new URL(loc, current).toString();
    hops.push(current);
  }
  return { original, destination: null, cid: null, hops };
}

/** Classification after repair: the URL `/api/out` would actually use. */
export function classify(raw: string): { url: string | null; network: LinkNetwork | null } {
  const url = normalizeUrl(raw);
  return url ? { url, network: linkNetwork({ url }) } : { url: null, network: null };
}

/** Runs `fn` over `items` with at most `limit` in flight. */
export async function pool<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]);
      }
    }),
  );
  return out;
}

export function dbGuard(dbName: string, commit: boolean) {
  console.log(`Database: ${dbName}${commit ? "  (COMMIT — will write)" : "  (dry run)"}`);
  if (commit && /prod/i.test(dbName) && !process.argv.includes("--yes-prod")) {
    console.error("Refusing to write to a prod database without --yes-prod.");
    process.exit(1);
  }
}
