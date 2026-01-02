import { CardCategories } from "../lib/data/cards";
import mongoose, { Document, Schema } from "mongoose";

export interface Card extends Document {
  name: string;
  bankName: string;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CardSchema: Schema<Card> = new Schema(
  {
    name: {
      type: String,
      required: [true, "Card name is required"],
      trim: true,
    },
    bankName: {
      type: String,
      required: [true, "Bank name is required"],
      trim: true,
    },
    category: {
      type: String,
      enum: CardCategories,
      default: "other",
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

const CardModel =
  (mongoose.models.Card as mongoose.Model<Card>) ||
  mongoose.model<Card>("Card", CardSchema);

export default CardModel;
