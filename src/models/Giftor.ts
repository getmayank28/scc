import mongoose from "mongoose";

const GiftorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    bankId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bank",
      required: true,
    },
    type: {
      type: String,
      enum: ["voucher", "offers", "instant", "other"],
      default: "voucher",
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
  },
  { timestamps: true },
);

export default mongoose.models.Giftor || mongoose.model("Giftor", GiftorSchema);
