import { flush, init, track } from "@amplitude/analytics-node";

/**
 * Server-side Amplitude, for funnel steps that happen without the user's
 * browser (a bank approving a card arrives through the Cuelinks webhook).
 * Same project as the browser SDK, and `user_id` is the same Mongo user id
 * AnalyticsIdentifier sets, so server and browser events join per user.
 *
 * Never throws: analytics must not fail a webhook.
 */

let ready = false;

export async function trackServerEvent(
  eventName: string,
  userId: string,
  properties: Record<string, unknown>,
): Promise<void> {
  const apiKey = process.env.AMPLITUDE_API_KEY ?? process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY;
  if (!apiKey) return;
  try {
    if (!ready) {
      init(apiKey, { logLevel: 0 });
      ready = true;
    }
    track(eventName, { ...properties, environment: process.env.NODE_ENV }, { user_id: userId });
    // Serverless: the instance may freeze right after the response, so send now.
    await flush().promise;
  } catch (err) {
    console.error("[analytics/server] track failed", eventName, err);
  }
}
