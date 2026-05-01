import mongoose, { Schema, Types, Document } from "mongoose";

export interface SpendTransaction extends Document {
  userId: Types.ObjectId;
  category: string;
  amount: number;
  merchant: string;
  transactionMode: string;
  cards: {
    cardId: string;
    cardName: string;
    directSwipePortalLink: string;
    directSwipeSavingsInInr: number;
    isBestCard: boolean;
    isDirectSwipePortalSavings: boolean;
    voucherSavingsInInr: number;
  }[];
}

const SpendTransactionSchema = new Schema<SpendTransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    merchant: {
      type: String,
      required: true,
      trim: true,
    },

    transactionMode: {
      type: String,
      required: true,
    },

    cards: [
      {
        cardId: { type: String, required: true },
        cardName: { type: String, required: true },
        directSwipePortalLink: { type: String, default: "" },
        directSwipeSavingsInInr: { type: Number, default: 0 },
        isBestCard: { type: Boolean, default: false },
        isDirectSwipePortalSavings: { type: Boolean, default: false },
        voucherSavingsInInr: { type: Number, default: 0 },
      },
    ],
  },
  {
    timestamps: true,
  },
);

SpendTransactionSchema.index({ userId: 1, createdAt: -1 });

const SpendTransactionModel =
  mongoose.models.SpendTransaction ||
  mongoose.model<SpendTransaction>("SpendTransaction", SpendTransactionSchema);

export default SpendTransactionModel;
