import "server-only";
import { createHash } from "crypto";
import { META_PIXEL_ID } from "./metaPixel";
import type { Attribution } from "./attribution";

// Meta Conversions API: the server-side copy of pixel events. The browser pixel
// loses a large share of events to ad blockers and iOS; these don't. When the
// browser also fires the event, both carry the same `eventId` and Meta keeps one.
//
// No-op without META_CAPI_ACCESS_TOKEN, so local/staging stay silent unless
// configured. Set META_CAPI_TEST_EVENT_CODE to see events under Events Manager →
// Test events instead of counting them.

const GRAPH_VERSION = "v24.0";

export interface MetaServerEvent {
  eventName: string;
  eventId: string;
  /** Page the action happened on; the Referer is usually right. */
  eventSourceUrl?: string | null;
  userId?: string | null;
  /** 10-digit Indian mobile, as stored on the user. */
  phoneNumber?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  /** `_fbp` cookie. */
  fbp?: string | null;
  /** `_fbc` cookie; rebuilt from the stored fbclid when the pixel didn't set it. */
  fbc?: string | null;
  attribution?: Attribution;
  customData?: Record<string, unknown>;
}

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

export function clientIp(forwardedFor: string | null | undefined): string | undefined {
  return forwardedFor?.split(",")[0]?.trim() || undefined;
}

export async function sendMetaEvent(event: MetaServerEvent): Promise<void> {
  const token = process.env.META_CAPI_ACCESS_TOKEN;
  if (!token) return;

  const fbclid = event.attribution?.fbclid;
  const fbc =
    event.fbc ||
    (fbclid ? `fb.1.${event.attribution?.capturedAt ?? Date.now()}.${fbclid}` : undefined);

  const userData: Record<string, unknown> = { country: [sha256("in")] };
  if (event.phoneNumber) userData.ph = [sha256(`91${event.phoneNumber.replace(/\D/g, "").slice(-10)}`)];
  if (event.userId && event.userId !== "anon") userData.external_id = [sha256(event.userId)];
  if (event.ip) userData.client_ip_address = event.ip;
  if (event.userAgent) userData.client_user_agent = event.userAgent;
  if (event.fbp) userData.fbp = event.fbp;
  if (fbc) userData.fbc = fbc;

  const body: Record<string, unknown> = {
    data: [
      {
        event_name: event.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: event.eventId,
        action_source: "website",
        ...(event.eventSourceUrl ? { event_source_url: event.eventSourceUrl } : {}),
        user_data: userData,
        ...(event.customData ? { custom_data: event.customData } : {}),
      },
    ],
  };
  if (process.env.META_CAPI_TEST_EVENT_CODE) {
    body.test_event_code = process.env.META_CAPI_TEST_EVENT_CODE;
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(5000),
      },
    );
    if (!res.ok) {
      console.error("[metaCapi] rejected", event.eventName, res.status, await res.text());
    }
  } catch (err) {
    console.error("[metaCapi] send failed", event.eventName, err);
  }
}
