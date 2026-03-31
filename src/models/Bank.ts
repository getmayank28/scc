import mongoose from "mongoose";

const BankSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, unique: true },
    website: { type: String, default: null },
  },
  { timestamps: true },
);

export default mongoose.models.Bank || mongoose.model("Bank", BankSchema);
