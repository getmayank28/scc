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
  bankSlug: string;
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
    bankSlug: { type: String, required: true, trim: true, index: true },
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
