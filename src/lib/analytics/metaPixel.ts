// Meta Pixel events for the sign-up funnel. The base pixel (init + PageView)
// is loaded in the root layout; events wait briefly for it to load.

type Fbq = (
  method: "track" | "trackCustom",
  event: string,
  params?: Record<string, unknown>,
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

export function trackMetaPixel(
  event: MetaPixelEvent,
  params?: Record<string, unknown>,
  attempt = 0,
) {
  if (typeof window === "undefined") return;
  if (!window.fbq) {
    if (attempt < MAX_ATTEMPTS) {
      setTimeout(() => trackMetaPixel(event, params, attempt + 1), RETRY_MS);
    }
    return;
  }
  try {
    window.fbq(
      STANDARD_EVENTS.has(event) ? "track" : "trackCustom",
      event,
      params,
    );
  } catch (error) {
    console.error("Meta Pixel tracking error:", error);
  }
}
