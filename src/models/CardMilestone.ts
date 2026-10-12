import mongoose, { Schema, Document } from "mongoose";

// One document per spend-triggered milestone tier. `cardSlug` matches Card.slug
// — joined by the stable string slug (same convention as CardRule) so the
// recommendation engine can look up milestones without an ObjectId ref.
export interface CardMilestoneDoc extends Document {
  milestoneKey: string;
  cardSlug: string;
  milestone_type: string | null;
  milestone_period:
    | "one_time"
    | "daily"
    | "monthly"
    | "quarterly"
    | "halfyearly"
    | "annually"
    | null;
  spend_threshold_inr: number | null;
  // Sequence within a mutual_exclusivity_group (1, 2, 3...) so the engine
  // knows which tier is "higher" when only one can be paid out.
  tier_order: number | null;
  // Tiers sharing this key are alternatives — reaching a higher tier
  // replaces the lower one instead of stacking (e.g. IDFC Mayura's
  // ₹8L / ₹15L annual milestones).
  mutual_exclusivity_group: string | null;
  benefit_type: "points" | "cashback" | "membership" | "voucher" | null;
  benefit_value_inr: number | null;
  is_active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CardMilestoneSchema = new Schema<CardMilestoneDoc>(
  {
    milestoneKey: { type: String, required: true, unique: true, index: true },
    cardSlug: { type: String, required: true, index: true },
    milestone_type: { type: String, default: null },
    milestone_period: { type: String, default: null },
    spend_threshold_inr: { type: Number, default: null },
    tier_order: { type: Number, default: null },
    mutual_exclusivity_group: { type: String, default: null },
    benefit_type: { type: String, default: null },
    benefit_value_inr: { type: Number, default: null },
    is_active: { type: Boolean, required: true, default: true },
  },
  { timestamps: true },
);

// Covers the recommendation-engine query: load all active milestones for a
// card, ordered by tier.
CardMilestoneSchema.index({ cardSlug: 1, is_active: 1, tier_order: 1 });

const CardMilestoneModel =
  (mongoose.models.CardMilestone as mongoose.Model<CardMilestoneDoc>) ||
  mongoose.model<CardMilestoneDoc>("CardMilestone", CardMilestoneSchema);

export default CardMilestoneModel;
