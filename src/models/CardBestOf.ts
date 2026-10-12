import mongoose, { Schema, Document } from "mongoose";
import type { Category } from "@/lib/logic/advisor/cards";
import type { MockBestOf } from "@/lib/logic/advisor/bestOf";

// Precompute cache: one document per (card, category). `payload` is the entire
// MockBestOf shape (frontiers + legacy bestDirectSwipe/bestVoucher + baseTier),
// stored opaquely so the engine code consumes it unchanged.
export interface CardBestOfDoc extends Document {
  cardSlug: string;
  category: Category;
  rulesVersion: number;
  payload: MockBestOf;
  computedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CardBestOfSchema = new Schema<CardBestOfDoc>(
  {
    cardSlug: { type: String, required: true, index: true },
    category: { type: String, required: true },
    rulesVersion: { type: Number, required: true },
    payload: { type: Schema.Types.Mixed, required: true },
    computedAt: { type: Date, required: true, default: () => new Date() },
  },
  { timestamps: true },
);

CardBestOfSchema.index({ cardSlug: 1, category: 1 }, { unique: true });

const CardBestOfModel =
  (mongoose.models.CardBestOf as mongoose.Model<CardBestOfDoc>) ||
  mongoose.model<CardBestOfDoc>("CardBestOf", CardBestOfSchema);

export default CardBestOfModel;
