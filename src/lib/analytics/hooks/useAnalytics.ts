import { useCallback } from "react";
import { trackEvent } from "../track";
import { EventName, EventPropertiesMap } from "../types";

/**
 * Generic analytics hook. Provides a type-safe `track` method
 * that auto-injects the current platform. Use it in any feature:
 *
 *   const { track } = useAnalytics();
 *   track(EventName.SPEND_OPTIMIZER_CARD_SELECTED, { cardId, ... });
 *
 * The EventPropertiesMap enforces correct properties per event
 * at compile time — no guessing, no runtime surprises.
 */
export function useAnalytics() {
  const platform = usePlatform();

  const track = useCallback(
    <T extends EventName>(eventName: T, properties: EventPropertiesMap[T]) => {
      trackEvent(eventName, { ...properties, platform });
    },
    [platform],
  );

  return { track, platform };
}

function usePlatform(): "desktop" | "mobile" {
  if (typeof window === "undefined") return "desktop";
  return window.innerWidth < 768 ? "mobile" : "desktop";
}
