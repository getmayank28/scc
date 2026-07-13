import mongoose, { Schema, Document, Types } from "mongoose";
import type {
  Category,
  CardNetwork,
  RewardType,
  WelcomeBenefitType,
  LoungeAccess,
} from "@/lib/logic/advisor/cards";

// Separate from the existing `Card` collection so existing routes keep working
// unchanged. `advisorKey` is the stable string id used across rules/bestOf
// (matches MockCard._id, e.g. "card_hdfc_regalia_gold").
export interface CardDoc extends Document {
  advisorKey: string;
  cardId?: Types.ObjectId | null;
  name: string;
  slug: string;
  bankName: string;
  bankId?: Types.ObjectId | null;
  issuer: string[];
  product_type: string;
  invitation_only: boolean;
  network: CardNetwork[];
  eligibility: {
    min_salary_inr: number;
    min_self_employed_income_inr: number;
    min_age: number;
    max_age: number;
  };
  fees: {
    joining_inr: number;
    joining_gst_inr: number;
    annual_inr: number;
    annual_gst_inr: number;
    waiver_spend_inr: number;
    joining_waiver_spend_inr: number;
    joining_fee_waiver_days: number | null;
    is_lifetime_free: boolean;
  };
  forex_markup_percentage: number;
  rewards: {
    base_reward_rate: number;
    point_value_inr: number;
    points_expiry_months: number | null;
    reward_type: RewardType;
  };
  categories: Category[];
  welcome_benefit: {
    type: WelcomeBenefitType;
    value_inr: number;
    condition: string;
    expires_in_months: number;
    display: string;
  } | null;
  lounge: {
    domestic: LoungeAccess | null;
    international: LoungeAccess | null;
  };
  ideal_for: string[];
  not_ideal_for: string[];
  miles_and_hotel_transfer_available: boolean;
  miles_and_hotel_partners: string[];
  max_value_on_transfer: string[];
  is_active: boolean;
  excluded_categories: Category[];
  // Bumped on any rule write for this card; used to detect stale CardBestOf
  // payloads during the request-time staleness check.
  rulesVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const CardAdvisorSchema = new Schema<CardDoc>(
  {
    advisorKey: { type: String, required: true, unique: true, index: true },
    cardId: {
      type: Schema.Types.ObjectId,
      ref: "Card",
      default: null,
    },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    bankName: { type: String, required: true, trim: true, index: true },
    bankId: {
      type: Schema.Types.ObjectId,
      ref: "Bank",
      default: null,
      index: true,
    },
    issuer: { type: [String], default: [] },
    product_type: { type: String, default: "cc", trim: true },
    invitation_only: { type: Boolean, default: false },
    network: { type: [String], default: [] },
    eligibility: { type: Schema.Types.Mixed, required: true },
    fees: { type: Schema.Types.Mixed, required: true },
    forex_markup_percentage: { type: Number, required: true },
    rewards: { type: Schema.Types.Mixed, required: true },
    categories: { type: [String], default: [] },
    welcome_benefit: { type: Schema.Types.Mixed, default: null },
    lounge: { type: Schema.Types.Mixed, required: true },
    ideal_for: { type: [String], default: [] },
    not_ideal_for: { type: [String], default: [] },
    miles_and_hotel_transfer_available: { type: Boolean, default: false },
    miles_and_hotel_partners: { type: [String], default: [] },
    max_value_on_transfer: { type: [String], default: [] },
    is_active: { type: Boolean, required: true, index: true },
    excluded_categories: { type: [String], default: [] },
    rulesVersion: { type: Number, required: true, default: 1 },
  },
  { timestamps: true },
);

const CardAdvisorModel =
  (mongoose.models.CardAdvisor as mongoose.Model<CardDoc>) ||
  mongoose.model<CardDoc>("CardAdvisor", CardAdvisorSchema);

export default CardAdvisorModel;
