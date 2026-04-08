import mongoose from "mongoose";
export interface PortalProps {
  _id?: string; // or mongoose.Types.ObjectId if you prefer

  name: string;
  websiteUrl: string;

  portalType:
    | "e-commerce"
    | "food-and-delivery"
    | "grocery"
    | "travel"
    | "fashion"
    | "OTT/software"
    | "education"
    | "jewellery"
    | "healthcare"
    | "classifieds/auto"
    | "others";

  affiliateLink?: string | null;

  status: "active" | "inactive";

  slug: string;

  createdAt?: Date;
  updatedAt?: Date;
}

const PortalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    websiteUrl: {
      type: String,
      required: true,
    },

    portalType: {
      type: String,
      enum: [
        "e-commerce",
        "food-and-delivery",
        "grocery",
        "travel",
        "fashion",
        "OTT/software",
        "education",
        "jewellery",
        "healthcare",
        "classifieds/auto",
        "others",
      ],
      default: "other",
    },

    affiliateLink: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
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

export default mongoose.models.Portal || mongoose.model("Portal", PortalSchema);
