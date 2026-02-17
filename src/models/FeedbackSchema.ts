import { Schema, models, model } from "mongoose";

const FeedbackSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    feedback: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["open", "progress", "resolved", "closed"],
      default: "open",
      index: true,
    },
  },
  { timestamps: true },
);

export default models.Feedback || model("Feedback", FeedbackSchema);
