import mongoose, { Schema } from "mongoose";

/**
 * One row per outbound click through `/api/out`. This is our own record of the
 * click; Phase 2 joins Cuelinks transactions back onto it via the sub IDs.
 *
 * `step` records which rung of the resolution ladder produced the destination,
 * so we can see how much traffic actually earns versus falls through.
 */
export type OutboundStep =
  | "cuelinks" // converted through Cuelinks and affiliated
  | "cuelinks_static" // pre-made Cuelinks link, redirected as-is
  | "gromo" // GroMo link, redirected as-is
  | "partner" // another affiliate network's link, redirected as-is
  | "direct" // raw destination, nothing affiliated
  | "bank_site" // card fell back to its bank's website
  | "internal"; // nothing usable; sent back into our app

export interface OutboundClickProps {
  userId: string;
  type: "card" | "portal" | "voucher" | "offer";
  targetId: string;
  surface: string;
  cardSlug?: string;
  /** Portal or giftor slug the click went to; for offers, the deal's portal. */
  merchantSlug?: string | null;
  channelId?: number;
  step: OutboundStep;
  destination: string;
  redirectUrl: string;
  affiliated: boolean;
  campaignId?: number | null;
  device: "mobile" | "desktop";
  createdAt: Date;
}

const OutboundClickSchema = new Schema<OutboundClickProps>(
  {
    userId: { type: String, required: true, index: true },
    type: { type: String, enum: ["card", "portal", "voucher", "offer"], required: true },
    targetId: { type: String, required: true },
    surface: { type: String, required: true },
    cardSlug: { type: String },
    merchantSlug: { type: String, default: null },
    channelId: { type: Number },
    step: {
      type: String,
      enum: [
        "cuelinks",
        "cuelinks_static",
        "gromo",
        "partner",
        "direct",
        "bank_site",
        "internal",
      ],
      required: true,
    },
    destination: { type: String, required: true },
    redirectUrl: { type: String, required: true },
    affiliated: { type: Boolean, required: true },
    campaignId: { type: Number, default: null },
    device: { type: String, enum: ["mobile", "desktop"], required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

OutboundClickSchema.index({ type: 1, targetId: 1, createdAt: -1 });

export default mongoose.models.OutboundClick ||
  mongoose.model<OutboundClickProps>("OutboundClick", OutboundClickSchema);
