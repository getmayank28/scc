import { timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";

/**
 * Shared plumbing for the Cuelinks webhook receivers.
 *
 * Cuelinks doesn't sign deliveries. Instead each webhook is configured in the
 * dashboard with a constant `secret` parameter, which we compare here.
 * Deliveries can be GET (params in the query) or POST (form-encoded body), so
 * both are read and merged.
 */

export async function readParams(req: NextRequest): Promise<Record<string, string>> {
  const params: Record<string, string> = {};
  req.nextUrl.searchParams.forEach((v, k) => (params[k] = v));
  if (req.method !== "POST") return params;

  const text = await req.text().catch(() => "");
  if (!text) return params;
  if ((req.headers.get("content-type") ?? "").includes("application/json")) {
    try {
      const body = JSON.parse(text) as Record<string, unknown>;
      for (const [k, v] of Object.entries(body)) if (v != null) params[k] = String(v);
    } catch {
      // Fall through: a malformed body just contributes nothing.
    }
    return params;
  }
  new URLSearchParams(text).forEach((v, k) => (params[k] = v));
  return params;
}

/**
 * "ok" when `provided` matches the configured secret. "unconfigured" when
 * none is set: every delivery is refused rather than accepted unverified.
 */
export function checkSecret(provided: string | undefined): "ok" | "bad" | "unconfigured" {
  const expected = process.env.CUELINKS_WEBHOOK_SECRET;
  if (!expected) return "unconfigured";
  if (!provided) return "bad";
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b) ? "ok" : "bad";
}
