// Where a visitor came from (ad UTMs + Meta's fbclid), kept in a first-party
// cookie so the server can stamp it onto the user at sign-up and onto every
// outbound click — that's what joins a Cuelinks payout back to an ad.
//
// Last non-direct touch: a visit that carries any of these params overwrites
// the cookie; a plain visit leaves it alone.

export const ATTRIBUTION_COOKIE = "fs_attr";
const MAX_AGE_S = 60 * 60 * 24 * 30;
const MAX_LEN = 200;

const PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
] as const;

export type Attribution = Partial<Record<(typeof PARAMS)[number], string>> & {
  landingPath?: string;
  /** ms since epoch — also the fbclid's click time when building `_fbc`. */
  capturedAt?: number;
};

/** Client: call on page load. Writes the cookie only when the URL carries attribution. */
export function captureAttribution() {
  if (typeof window === "undefined") return;
  const sp = new URLSearchParams(window.location.search);
  const attr: Attribution = {};
  for (const key of PARAMS) {
    const value = sp.get(key);
    if (value) attr[key] = value.slice(0, MAX_LEN);
  }
  if (Object.keys(attr).length === 0) return;
  attr.landingPath = window.location.pathname.slice(0, MAX_LEN);
  attr.capturedAt = Date.now();
  document.cookie =
    `${ATTRIBUTION_COOKIE}=${encodeURIComponent(JSON.stringify(attr))}` +
    `; Max-Age=${MAX_AGE_S}; Path=/; SameSite=Lax` +
    (window.location.protocol === "https:" ? "; Secure" : "");
}

/** Server: parse the cookie's (raw, still-encoded) value. Never throws. */
export function parseAttribution(raw: string | undefined | null): Attribution | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    if (!parsed || typeof parsed !== "object") return undefined;
    const attr: Attribution = {};
    for (const key of PARAMS) {
      if (typeof parsed[key] === "string") attr[key] = parsed[key].slice(0, MAX_LEN);
    }
    if (typeof parsed.landingPath === "string") attr.landingPath = parsed.landingPath.slice(0, MAX_LEN);
    if (typeof parsed.capturedAt === "number") attr.capturedAt = parsed.capturedAt;
    return Object.keys(attr).length ? attr : undefined;
  } catch {
    return undefined;
  }
}

/** Server: pull one cookie out of a raw `Cookie` header. */
export function readCookie(header: string | undefined | null, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq > -1 && part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim();
  }
  return undefined;
}
