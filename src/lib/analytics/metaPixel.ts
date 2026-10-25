// Meta Pixel events for the sign-up funnel. The base pixel (init + PageView)
// is loaded in the root layout; events wait briefly for it to load.

export const META_PIXEL_ID = "2461056737756426";

type Fbq = (
  method: "track" | "trackCustom",
  event: string,
  params?: Record<string, unknown>,
  options?: { eventID?: string },
) => void;

declare global {
  interface Window {
    fbq?: Fbq;
  }
}

export enum MetaPixelEvent {
  LANDING_PAGE_VIEWED = "LandingPageViewed",
  SIGNUP_PAGE_VIEWED = "SignUpPageViewed",
  // Meta standard event — usable as an ad-optimisation goal.
  COMPLETE_REGISTRATION = "CompleteRegistration",
}

const STANDARD_EVENTS = new Set<string>([MetaPixelEvent.COMPLETE_REGISTRATION]);

// The pixel script loads afterInteractive, so a mount-time event can fire
// before window.fbq exists — retry briefly instead of dropping it.
const RETRY_MS = 250;
const MAX_ATTEMPTS = 20;

/**
 * `eventId` must match the one the server sends for the same event through the
 * Conversions API (see metaCapi.ts) so Meta counts it once.
 */
export function trackMetaPixel(
  event: MetaPixelEvent,
  params?: Record<string, unknown>,
  eventId?: string,
) {
  fire(event, params, eventId, 0);
}

function fire(
  event: MetaPixelEvent,
  params: Record<string, unknown> | undefined,
  eventId: string | undefined,
  attempt: number,
) {
  if (typeof window === "undefined") return;
  if (!window.fbq) {
    if (attempt < MAX_ATTEMPTS) {
      setTimeout(() => fire(event, params, eventId, attempt + 1), RETRY_MS);
    }
    return;
  }
  try {
    window.fbq(
      STANDARD_EVENTS.has(event) ? "track" : "trackCustom",
      event,
      params,
      eventId ? { eventID: eventId } : undefined,
    );
  } catch (error) {
    console.error("Meta Pixel tracking error:", error);
  }
}
