import mongoose, { Schema, Document } from "mongoose";
import type { Category } from "@/lib/logic/advisor/cards";
import type {
  Merchant,
  CapPeriod,
  CapMetric,
  CapScope,
  SharedCapGroup,
} from "@/lib/logic/advisor/rules";

// One document per reward rule. `cardAdvisorKey` matches CardAdvisor.advisorKey
// — we join by string id rather than ObjectId because the precompute (bestOf)
// and engine code both use the stable string key.
export interface CardRuleDoc extends Document {
  ruleKey: string;
  cardAdvisorKey: string;
  category: Category;
  merchant: Merchant | null;
  reward: {
    direct_swipe_percentage: number;
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
  valid_from: Date;
  valid_until: Date | null;
  notes: string | null;
  is_active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CardRuleSchema = new Schema<CardRuleDoc>(
  {
    ruleKey: { type: String, required: true, unique: true, index: true },
    cardAdvisorKey: { type: String, required: true, index: true },
    category: { type: String, required: true },
    merchant: { type: String, default: null },
    reward: { type: Schema.Types.Mixed, required: true },
    caps: { type: Schema.Types.Mixed, required: true },
    shared_cap_group: { type: Schema.Types.Mixed, default: null },
    valid_from: { type: Date, required: true },
    valid_until: { type: Date, default: null },
    notes: { type: String, default: null },
    is_active: { type: Boolean, required: true },
  },
  { timestamps: true },
);

// Covers the recompute query: load all active rules for a (card, category) pair.
CardRuleSchema.index({ cardAdvisorKey: 1, category: 1, is_active: 1 });

const CardRuleModel =
  (mongoose.models.CardRule as mongoose.Model<CardRuleDoc>) ||
  mongoose.model<CardRuleDoc>("CardRule", CardRuleSchema);

export default CardRuleModel;
