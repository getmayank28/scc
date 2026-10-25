import { Schema } from "mongoose";

/**
 * Embedded copy of the visitor's ad attribution (see lib/analytics/attribution.ts),
 * stamped on users at sign-up and on outbound clicks.
 */
export const AttributionSchema = new Schema(
  {
    utm_source: String,
    utm_medium: String,
    utm_campaign: String,
    utm_content: String,
    utm_term: String,
    fbclid: String,
    landingPath: String,
    capturedAt: Number,
  },
  { _id: false },
);
