import { track } from "@amplitude/analytics-browser";
import { EventName } from "./types";

interface EventPropertiesProps {
  name?: string;
  buttonName?: string;
  location?: string;
  path?: string;
  referrer?: string;
}

export function trackEvent<T extends EventName>(
  eventName: T,
  properties: EventPropertiesProps,
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
