import mongoose, { Schema, Document } from "mongoose";
import type { Category } from "@/lib/logic/advisor/cards";
import type {
  Merchant,
  CapPeriod,
  CapMetric,
  CapScope,
  DirectSwipeSchedule,
  SharedCapGroup,
} from "@/lib/logic/advisor/rules";

// One document per reward rule. `cardSlug` matches Card.slug — we join by the
// stable string slug rather than ObjectId because the precompute (bestOf) and
// engine code both use it.
export interface CardRuleDoc extends Document {
  ruleKey: string;
  cardSlug: string;
  category: Category;
  merchant: Merchant | null;
  reward: {
    direct_swipe_percentage: number;
    direct_swipe_schedule?: DirectSwipeSchedule | null;
    voucher_discount_percentage: number;
    voucher_reward_percentage: number;
    convenience_fee_percentage: number;
  };
  caps: {
    reward_cap: {
      period: CapPeriod;
      metric: CapMetric;
      value: number;
      scope: CapScope;
    } | null;
    voucher_monthly_purchase_limit_inr: number | null;
    max_voucher_size_inr: number | null;
    vouchers_per_booking: number | null;
  };
  shared_cap_group: SharedCapGroup | null;
  fuel_surcharge_applicable: number;
  max_fuel_transaction_limit: number;
  redemption_mode: "online" | "offline" | "both";
  voucher_validity_in_months: number | null;
  gv_coins_percentage: number;
  valid_from: Date;
  valid_until: Date | null;
  notes: string | null;
  partner?: string | null;
  is_active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CardRuleSchema = new Schema<CardRuleDoc>(
  {
    ruleKey: { type: String, required: true, unique: true, index: true },
    cardSlug: { type: String, required: true, index: true },
    category: { type: String, required: true },
    merchant: { type: String, default: null },
    reward: { type: Schema.Types.Mixed, required: true },
    caps: { type: Schema.Types.Mixed, required: true },
    shared_cap_group: { type: Schema.Types.Mixed, default: null },
    fuel_surcharge_applicable: { type: Number, default: 0 },
    max_fuel_transaction_limit: { type: Number, default: 0 },
    redemption_mode: { type: String, default: "both" },
    voucher_validity_in_months: { type: Number, default: null },
    gv_coins_percentage: { type: Number, default: 0 },
    valid_from: { type: Date, required: true },
    valid_until: { type: Date, default: null },
    notes: { type: String, default: null },
    partner: { type: String, default: null },
    is_active: { type: Boolean, required: true },
  },
  { timestamps: true },
);

// Covers the recompute query: load all active rules for a (card, category) pair.
CardRuleSchema.index({ cardSlug: 1, category: 1, is_active: 1 });

const CardRuleModel =
  (mongoose.models.CardRule as mongoose.Model<CardRuleDoc>) ||
  mongoose.model<CardRuleDoc>("CardRule", CardRuleSchema);

export default CardRuleModel;
