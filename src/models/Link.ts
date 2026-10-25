import mongoose, { Types, Schema, Document } from "mongoose";
import type { LinkNetwork } from "@/types/link";

export interface LinkProps extends Document {
  cardId?: Types.ObjectId;
  bankId?: Types.ObjectId;
  partnerId?: Types.ObjectId;

  url: string;

  type?: "affiliate" | "bank" | "fallback";

  // How `/api/out` treats `url`. `direct` is a plain destination converted
  // through Cuelinks per click; `cuelinks` is an already-wrapped Cuelinks link,
  // `gromo` a GroMo link and `other` any further affiliate network, all
  // redirected to as-is. Unset rows are classified from the hostname (see
  // `linkNetwork`).
  network?: LinkNetwork;
  // Cuelinks campaign this destination belongs to, when known. Bank card
  // campaigns forbid deep links, so `url` must be the campaign's own landing
  // page for the click to earn.
  campaignId?: number;

  priority?: number;
  active?: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const LinkSchema = new Schema<LinkProps>(
  {
    cardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Card",
      index: true,
    },

    bankId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bank",
      index: true,
    },

    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Partner",
      index: true,
    },

    url: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["affiliate", "bank", "fallback"],
      default: "affiliate",
      index: true,
    },
    network: {
      type: String,
      enum: ["direct", "cuelinks", "gromo", "other"],
    },
    campaignId: { type: Number },
    priority: { type: Number, default: 1 },

    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.models.Link ||
  mongoose.model<LinkProps>("Link", LinkSchema);
