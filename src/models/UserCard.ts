import mongoose, { Schema, Document, Types } from "mongoose";

export interface UserCard extends Document {
  userId: string;
  cardId: Types.ObjectId;
  cardNumber?: string;
}

const UserCardSchema = new Schema<UserCard>(
  {
    userId: {
      type: String,
      ref: "User",
      required: true,
      index: true,
    },
    cardId: {
      type: Schema.Types.ObjectId,
      ref: "Card",
      required: true,
      index: true,
    },
    cardNumber: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

UserCardSchema.index({ userId: 1, cardId: 1 }, { unique: true });

const UserCardModel =
  mongoose.models.UserCard ||
  mongoose.model<UserCard>("UserCard", UserCardSchema);

export default UserCardModel;
