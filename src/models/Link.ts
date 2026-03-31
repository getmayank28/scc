import mongoose, { Types, Schema, Document } from "mongoose";

export interface LinkProps extends Document {
  cardId?: Types.ObjectId;
  bankId?: Types.ObjectId;
  partnerId?: Types.ObjectId;

  url: string;

  type?: "affiliate" | "bank" | "fallback";

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
