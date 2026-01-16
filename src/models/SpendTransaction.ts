import mongoose, { Schema, Types, Document } from "mongoose";

export interface SpendTransaction extends Document {
  userId: Types.ObjectId;
  category: string;
  amount: number;
  merchant: string;
  paymentMethod: string;
  emi: string;
  cards: {
    cardId: Types.ObjectId;
    name: string;
    bankName: string;
  }[];
  recommendation?: string | undefined;
  currency: string;
  cardName: string | undefined;
  expectedBenefit: string | undefined;
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

    cardName: {
      type: String,
      required: true,
      trim: true,
    },
    expectedBenefit: {
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

    paymentMethod: {
      type: String,
      required: true,
    },

    emi: {
      type: String,
      default: "no-emi",
    },

    cards: [
      {
        cardId: {
          type: Schema.Types.ObjectId,
          ref: "Card",
          required: true,
        },
        name: { type: String, required: true },
        bankName: { type: String, required: true },
      },
    ],

    recommendation: {
      type: String,
    },

    currency: {
      type: String,
      default: "INR",
    },
  },
  {
    timestamps: true,
  }
);

SpendTransactionSchema.index({ userId: 1, createdAt: -1 });

const SpendTransactionModel =
  mongoose.models.SpendTransaction ||
  mongoose.model<SpendTransaction>("SpendTransaction", SpendTransactionSchema);

export default SpendTransactionModel;
