import mongoose, { Schema, models } from "mongoose";

const WaitlistSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    mobile: {
      type: String,
      required: false,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Waitlist =
  models.Waitlist || mongoose.model("Waitlist", WaitlistSchema);
