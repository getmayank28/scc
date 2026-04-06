import mongoose, { Schema, Model, Document } from "mongoose";

export type PartnerType = "affiliate_network" | "bank" | "direct";

export interface Partner extends Document {
  name: string;
  slug: string;
  type: PartnerType;
  baseUrl?: string; // e.g. tracking base
  active: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const PartnerSchema = new Schema<Partner>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    type: {
      type: String,
      enum: ["affiliate_network", "bank", "direct"],
      required: true,
    },

    baseUrl: {
      type: String,
    },

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

PartnerSchema.index({ type: 1, active: 1 });

const PartnerModel: Model<Partner> =
  mongoose.models.Partner || mongoose.model<Partner>("Partner", PartnerSchema);

export default PartnerModel;
