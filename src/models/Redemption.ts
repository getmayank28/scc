import mongoose from "mongoose";

const RedemptionOptionSchema = new mongoose.Schema(
  {
    redemptionOptionTitle: { type: String, required: true },
    redemptionOptionDescription: { type: String },
    pointConversionRatioInInr: { type: Number },
    note: { type: String },
    category: { type: String },
    portalLink: { type: String },
    highestReturn: { type: Number },
    points: { type: Number },
  },
  { _id: false },
);

const RedemptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    cardName: { type: String, required: true },
    points: { type: Number, required: true },
    redemptionOptions: { type: [RedemptionOptionSchema], required: true },
  },
  { timestamps: true },
);

export default mongoose.models.Redemption ||
  mongoose.model("Redemption", RedemptionSchema);
