import { track } from "@amplitude/analytics-browser";
import { EventName, EventPropertiesMap } from "./types";

/**
 * Type-safe event tracker. The properties argument is enforced
 * by the EventPropertiesMap — passing wrong properties for an
 * event name is a compile-time error.
 */
export function trackEvent<T extends EventName>(
  eventName: T,
  properties: EventPropertiesMap[T],
) {
  try {
    track(eventName, {
      ...properties,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Tracking error:", error);
  }
}
