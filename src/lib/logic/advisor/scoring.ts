import type { MockCard } from "./cards";
import type {
  EmploymentTypeValue,
  IncomeRangeValue,
} from "@/schemas/userInfoSchema";

// Plain-object mirror of CardMilestoneDoc (src/models/CardMilestone.ts) so the
// engines stay mongoose-free. Joined to MockCard by `cardSlug` === card._id.
export interface MockMilestone {
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
  tier_order: number | null;
  mutual_exclusivity_group: string | null;
  benefit_type: "points" | "cashback" | "membership" | "voucher" | null;
  benefit_value_inr: number | null;
}

export interface UserProfile {
  employmentType?: EmploymentTypeValue;
  salaryRange?: IncomeRangeValue;
}

// Optional trailing argument accepted by every engine entry point. When
// `profile` is absent the income filter is skipped; when `milestonesBySlug` is
// absent milestone return is 0. Fee deduction always applies.
export interface EngineScoringOptions {
  profile?: UserProfile;
  milestonesBySlug?: Map<string, MockMilestone[]>;
}

// Bracket midpoints. Salaried/retired brackets are MONTHLY take-home and
// self-employed brackets are ANNUAL (per getIncomeLabel in userInfoSchema), so
// the monthly midpoints are annualized ×12. Open-bottom brackets average from 0
// (e.g. below_30k → 15k/mo → 1.8L/yr).
const MONTHLY_BRACKET_MIDPOINT_INR: Partial<Record<IncomeRangeValue, number>> = {
  below_30k: 15_000,
  "30k_to_50k": 40_000,
  "50k_to_1l": 75_000,
  "1l_to_2l": 150_000,
  "1l_to_2_5l": 175_000,
  "2_5l_to_5l": 375_000,
};

const ANNUAL_BRACKET_MIDPOINT_INR: Partial<Record<IncomeRangeValue, number>> = {
  below_5l: 250_000,
  "5l_to_10l": 750_000,
  "10l_to_20l": 1_500_000,
  "20l_to_50l": 3_500_000,
  "50l_to_1cr": 7_500_000,
};

// Annual income estimate for eligibility checks; null means "unknown — do not
// filter on income".
export function annualIncomeInrForProfile(
  profile?: UserProfile,
): number | null {
  if (!profile?.employmentType) return null;
  if (profile.employmentType === "student_unemployed") return 0;
  if (!profile.salaryRange) return null;
  if (profile.employmentType === "self_employed") {
    return ANNUAL_BRACKET_MIDPOINT_INR[profile.salaryRange] ?? null;
  }
  const monthly = MONTHLY_BRACKET_MIDPOINT_INR[profile.salaryRange];
  return monthly === undefined ? null : monthly * 12;
}

export function isCardEligible(
  card: MockCard,
  profile?: UserProfile,
): boolean {
  if (card.invitation_only) return false;

  const income = annualIncomeInrForProfile(profile);
  if (income === null) return true;

  const minIncome =
    profile?.employmentType === "self_employed"
      ? card.eligibility?.min_self_employed_income_inr
      : card.eligibility?.min_salary_inr;
  if (!minIncome) return true;
  return income >= minIncome;
}

export function filterEligibleCards(
  cards: MockCard[],
  profile?: UserProfile,
): MockCard[] {
  return cards.filter((c) => c.is_active && isCardEligible(c, profile));
}

// Waiver-aware annual fee: lifetime-free cards and cards whose spend-waiver
// threshold is met by the projected annual spend cost nothing; otherwise the
// renewal fee plus its GST applies.
export function computeAnnualFeeInr(
  card: MockCard,
  annualSpendInr: number,
): { feeInr: number; feeWaived: boolean } {
  const fees = card.fees;
  if (!fees) return { feeInr: 0, feeWaived: false };
  if (fees.is_lifetime_free) return { feeInr: 0, feeWaived: true };
  const annualFee = (fees.annual_inr ?? 0) + (fees.annual_gst_inr ?? 0);
  if (annualFee <= 0) return { feeInr: 0, feeWaived: false };
  if (fees.waiver_spend_inr > 0 && annualSpendInr >= fees.waiver_spend_inr) {
    return { feeInr: 0, feeWaived: true };
  }
  return { feeInr: annualFee, feeWaived: false };
}

const MILESTONE_OCCURRENCES_PER_YEAR: Record<string, number> = {
  daily: 365,
  monthly: 12,
  quarterly: 4,
  halfyearly: 2,
  annually: 1,
};

export interface AchievedMilestone {
  milestoneKey: string;
  milestoneType: string | null;
  period: "daily" | "monthly" | "quarterly" | "halfyearly" | "annually";
  occurrencesPerYear: number;
  spendThresholdInr: number;
  benefitValueInr: number; // per occurrence
  annualValueInr: number; // benefitValueInr × occurrencesPerYear
}

// Threshold-checked milestone value: spend is assumed evenly spread, so the
// per-period spend is annual / occurrences; an achieved milestone pays its
// benefit every period. `one_time` milestones (joining benefits) are excluded.
// Within a mutual_exclusivity_group only one achieved tier is credited — the
// one with the highest priority, i.e. the LOWEST tier_order number (1 beats 2;
// null tier_order ranks last; ties go to the higher annual value).
export function computeMilestoneReturnInr(
  milestones: MockMilestone[] | undefined,
  annualSpendInr: number,
): { milestoneReturnInr: number; achievedMilestones: AchievedMilestone[] } {
  if (!milestones || milestones.length === 0) {
    return { milestoneReturnInr: 0, achievedMilestones: [] };
  }

  const achievedByGroup = new Map<
    string,
    { achieved: AchievedMilestone; tier: number }
  >();
  const ungrouped: AchievedMilestone[] = [];

  for (const m of milestones) {
    if (!m.milestone_period || m.milestone_period === "one_time") continue;
    if (m.spend_threshold_inr === null || m.spend_threshold_inr <= 0) continue;
    if (m.benefit_value_inr === null || m.benefit_value_inr <= 0) continue;

    const occurrences = MILESTONE_OCCURRENCES_PER_YEAR[m.milestone_period];
    if (!occurrences) continue;
    const periodSpend = annualSpendInr / occurrences;
    if (periodSpend < m.spend_threshold_inr) continue;

    const achieved: AchievedMilestone = {
      milestoneKey: m.milestoneKey,
      milestoneType: m.milestone_type,
      period: m.milestone_period,
      occurrencesPerYear: occurrences,
      spendThresholdInr: m.spend_threshold_inr,
      benefitValueInr: m.benefit_value_inr,
      annualValueInr: m.benefit_value_inr * occurrences,
    };

    if (!m.mutual_exclusivity_group) {
      ungrouped.push(achieved);
      continue;
    }
    const tier = m.tier_order ?? Number.POSITIVE_INFINITY;
    const current = achievedByGroup.get(m.mutual_exclusivity_group);
    if (
      !current ||
      tier < current.tier ||
      (tier === current.tier &&
        achieved.annualValueInr > current.achieved.annualValueInr)
    ) {
      achievedByGroup.set(m.mutual_exclusivity_group, { achieved, tier });
    }
  }

  const achievedMilestones = [
    ...ungrouped,
    ...[...achievedByGroup.values()].map((v) => v.achieved),
  ];
  const milestoneReturnInr = achievedMilestones.reduce(
    (sum, m) => sum + m.annualValueInr,
    0,
  );
  return { milestoneReturnInr, achievedMilestones };
}

export interface CardScoreBreakdown {
  annualSpendInr: number;
  feeInr: number;
  feeWaived: boolean;
  milestoneReturnInr: number;
  achievedMilestones: AchievedMilestone[];
  finalReturnInr: number; // spend return + milestones − fee
}

export function finalizeCardScore(
  card: MockCard,
  spendReturnInr: number,
  annualSpendInr: number,
  milestones: MockMilestone[] | undefined,
): CardScoreBreakdown {
  const { feeInr, feeWaived } = computeAnnualFeeInr(card, annualSpendInr);
  const { milestoneReturnInr, achievedMilestones } = computeMilestoneReturnInr(
    milestones,
    annualSpendInr,
  );
  return {
    annualSpendInr,
    feeInr,
    feeWaived,
    milestoneReturnInr,
    achievedMilestones,
    finalReturnInr: spendReturnInr + milestoneReturnInr - feeInr,
  };
}
