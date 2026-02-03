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
  },
  { timestamps: true }
);

export default models.Feedback || model("Feedback", FeedbackSchema);
