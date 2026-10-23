import mongoose, { Schema } from "mongoose";

/**
 * Converted Cuelinks links, keyed by (destination, channel, sub IDs).
 *
 * The tracking URL is deterministic for a given input, so nothing here really
 * expires; the TTL is a safety net that also re-checks `affiliated` weekly,
 * because a campaign can be paused or granted access in the meantime.
 * Unaffiliated results are cached too, so dead destinations aren't re-asked on
 * every click. API failures are never cached.
 */
export interface AffiliateLinkCacheProps {
  key: string;
  trackingUrl: string;
  affiliated: boolean;
  campaignId: number | null;
  expiresAt: Date;
}

const AffiliateLinkCacheSchema = new Schema<AffiliateLinkCacheProps>({
  key: { type: String, required: true, unique: true },
  trackingUrl: { type: String, required: true },
  affiliated: { type: Boolean, required: true },
  campaignId: { type: Number, default: null },
  expiresAt: { type: Date, required: true, expires: 0 },
});

export default mongoose.models.AffiliateLinkCache ||
  mongoose.model<AffiliateLinkCacheProps>(
    "AffiliateLinkCache",
    AffiliateLinkCacheSchema,
  );
