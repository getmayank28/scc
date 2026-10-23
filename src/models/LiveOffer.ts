import mongoose, { Schema } from "mongoose";

/**
 * Live coupons and deals from Cuelinks `GET /offers`, for merchants we have a
 * portal for. Refreshed daily (src/lib/cuelinks/offers.ts); an offer that
 * stops appearing, or passes its end date, is deleted on the next refresh.
 *
 * `landingUrl` is the merchant URL taken from Cuelinks' tracking link. Clicks
 * never use that tracking link directly — it carries neither our channel nor
 * our sub IDs — `/api/out?type=offer` re-converts `landingUrl` instead.
 */
export interface LiveOfferProps {
  offerId: number;
  campaignId: number;
  /** Every portal on this campaign (e.g. Tata CLiQ, Luxe and Tata CLiQ Fashion share one). */
  portalSlugs: string[];
  title: string;
  description: string | null;
  terms: string | null;
  couponCode: string | null;
  offerType: "coupon" | "deal";
  percentOff: number | null;
  originalPrice: number | null;
  discountPrice: number | null;
  startDate: Date | null;
  endDate: Date | null;
  landingUrl: string | null;
  /** Issuer the deal is restricted to ("HSBC"), when its wording names one. */
  bank: string | null;
  refreshedAt: Date;
}

const LiveOfferSchema = new Schema<LiveOfferProps>(
  {
    offerId: { type: Number, required: true, unique: true },
    campaignId: { type: Number, required: true, index: true },
    portalSlugs: { type: [String], required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: null },
    terms: { type: String, default: null },
    couponCode: { type: String, default: null },
    offerType: { type: String, enum: ["coupon", "deal"], required: true },
    percentOff: { type: Number, default: null },
    originalPrice: { type: Number, default: null },
    discountPrice: { type: Number, default: null },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null, index: true },
    landingUrl: { type: String, default: null },
    bank: { type: String, default: null },
    refreshedAt: { type: Date, required: true },
  },
  { timestamps: true },
);

export default mongoose.models.LiveOffer ||
  mongoose.model<LiveOfferProps>("LiveOffer", LiveOfferSchema);
