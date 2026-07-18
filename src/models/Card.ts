import { CardCategories } from "../lib/data/cards";
import type {
  Category,
  CardNetwork,
  RewardType,
  WelcomeBenefitType,
  LoungeAccess,
} from "@/lib/logic/advisor/cards";
import mongoose, { Document, Schema, Types } from "mongoose";

// The single card collection. Cards are identified by the stable string `slug`
// (e.g. "card_hdfc_bank_hdfc_regalia_gold"). Rules/bestOf/milestones join on
// `slug` via their `cardSlug` field, never on `_id`.
export interface Card extends Document {
  name: string;
  bankName: string;
  category?: string;
  bankId?: Types.ObjectId | null;
  slug: string;
  createdAt: Date;
  updatedAt: Date;

  // Advisor fields (optional so plain card rows stay valid).
  issuer?: string[];
  product_type?: string;
  invitation_only?: boolean;
  network?: CardNetwork[];
  eligibility?: {
    min_salary_inr: number;
    min_self_employed_income_inr: number;
    min_age: number;
    max_age: number;
  };
  fees?: {
    joining_inr: number;
    joining_gst_inr: number;
    annual_inr: number;
    annual_gst_inr: number;
    waiver_spend_inr: number;
    joining_waiver_spend_inr: number;
    joining_fee_waiver_days: number | null;
    is_lifetime_free: boolean;
  };
  forex_markup_percentage?: number;
  rewards?: {
    base_reward_rate: number;
    point_value_inr: number;
    points_expiry_months: number | null;
    reward_type: RewardType;
  };
  categories?: Category[];
  welcome_benefit?: {
    type: WelcomeBenefitType;
    value_inr: number;
    condition: string;
    expires_in_months: number;
    display: string;
  } | null;
  lounge?: {
    domestic: LoungeAccess | null;
    international: LoungeAccess | null;
  };
  ideal_for?: string[];
  not_ideal_for?: string[];
  miles_and_hotel_transfer_available?: boolean;
  miles_and_hotel_partners?: string[];
  max_value_on_transfer?: string[];
  is_active?: boolean;
  excluded_categories?: Category[];
  // Bumped on any rule write for this card; used to detect stale CardBestOf
  // payloads during the request-time staleness check.
  rulesVersion?: number;
}

// Drop-in alias for former `import type { CardDoc } from "@/models/CardDoc"`.
export type CardDoc = Card;

const CardSchema: Schema<Card> = new Schema(
  {
    name: {
      type: String,
      required: [true, "Card name is required"],
      trim: true,
    },
    bankId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bank",
      default: null,
      index: true,
    },
    bankName: {
      type: String,
      required: [true, "Bank name is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, "Slug is required"],
      trim: true,
      unique: true,
      index: true,
    },
    category: {
      type: String,
      enum: CardCategories,
      default: "other",
    },

    // Advisor fields — optional so plain card rows remain valid.
    issuer: { type: [String], default: undefined },
    product_type: { type: String, trim: true },
    invitation_only: { type: Boolean },
    network: { type: [String], default: undefined },
    eligibility: { type: Schema.Types.Mixed },
    fees: { type: Schema.Types.Mixed },
    forex_markup_percentage: { type: Number },
    rewards: { type: Schema.Types.Mixed },
    categories: { type: [String], default: undefined },
    welcome_benefit: { type: Schema.Types.Mixed, default: undefined },
    lounge: { type: Schema.Types.Mixed },
    ideal_for: { type: [String], default: undefined },
    not_ideal_for: { type: [String], default: undefined },
    miles_and_hotel_transfer_available: { type: Boolean },
    miles_and_hotel_partners: { type: [String], default: undefined },
    max_value_on_transfer: { type: [String], default: undefined },
    is_active: { type: Boolean, index: true },
    excluded_categories: { type: [String], default: undefined },
    rulesVersion: { type: Number },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  },
);

const CardModel =
  (mongoose.models.Card as mongoose.Model<Card>) ||
  mongoose.model<Card>("Card", CardSchema);

export default CardModel;
