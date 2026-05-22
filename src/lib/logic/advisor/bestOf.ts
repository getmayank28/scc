import { type Category, MOCK_CARDS, type MockCard } from "./cards";
import {
  MOCK_RULES,
  type CapPeriod,
  type CapScope,
  type Merchant,
  type MockRule,
} from "./rules";

export interface BestDirectSwipe {
  merchant: Merchant;
  percentage: number;
  fallbackPercentage: number;
  cappedAnnualSpendInr: number | null;
  capNote: string | null;
  capScope: CapScope | null;
}

export interface BestVoucher {
  merchant: Merchant;
  breakdown: { discount: number; reward: number; fee: number };
  totalPercentage: number;
  cappedAnnualSpendInr: number | null;
  fallbackPercentage: number;
}

export interface MockBestOf {
  _id: string;
  cardId: string;
  category: Category;
  bestDirectSwipe: BestDirectSwipe | null;
  bestVoucher: BestVoucher | null;
  rulesVersion: number;
  computedAt: Date;
}

const PERIOD_TO_ANNUAL_MULTIPLIER: Record<CapPeriod, number> = {
  monthly: 12,
  quarterly: 4,
  annually: 1,
};

const METRIC_LABEL = {
  points: "pts",
  inr: "INR",
  cashback: "cashback",
} as const;

const PERIOD_LABEL: Record<CapPeriod, string> = {
  monthly: "month",
  quarterly: "quarter",
  annually: "year",
};

function annualSpendForCap(rule: MockRule, card: MockCard): number | null {
  const cap = rule.caps.reward_cap;
  if (!cap) return null;
  const ratePercentage = rule.reward.direct_swipe_percentage;
  if (ratePercentage <= 0) return null;

  // points: spend × (rate/100) = points × point_value_inr
  // inr/cashback: spend × (rate/100) = cap_value
  const perPeriodSpendInr =
    cap.metric === "points"
      ? (cap.value * card.rewards.point_value_inr * 100) / ratePercentage
      : (cap.value * 100) / ratePercentage;

  return Math.round(perPeriodSpendInr * PERIOD_TO_ANNUAL_MULTIPLIER[cap.period]);
}

function capNoteFor(rule: MockRule): string | null {
  const cap = rule.caps.reward_cap;
  if (!cap) return null;
  const valueStr = cap.value.toLocaleString("en-IN");
  const metric = METRIC_LABEL[cap.metric];
  const period = PERIOD_LABEL[cap.period];
  const shared = rule.shared_cap_group ? ` combined across ${rule.shared_cap_group}` : "";
  return `${valueStr} ${metric}/${period}${shared}`;
}

export function computeBestOfForCard(
  card: MockCard,
  allRules: MockRule[],
  rulesVersion = 1,
  computedAt: Date = new Date(),
): MockBestOf[] {
  const cardRules = allRules.filter((r) => r.cardId === card._id && r.is_active);
  const baseRate = card.rewards.base_reward_rate;
  const categories = Array.from(new Set(cardRules.map((r) => r.category)));

  const results: MockBestOf[] = [];

  for (const category of categories) {
    const rulesInCat = cardRules.filter((r) => r.category === category);

    let bestDirect: BestDirectSwipe | null = null;
    for (const r of rulesInCat) {
      if (!r.merchant) continue;
      const pct = r.reward.direct_swipe_percentage;
      if (pct <= baseRate) continue;
      if (!bestDirect || pct > bestDirect.percentage) {
        bestDirect = {
          merchant: r.merchant,
          percentage: pct,
          fallbackPercentage: baseRate,
          cappedAnnualSpendInr: annualSpendForCap(r, card),
          capNote: capNoteFor(r),
          capScope: r.caps.reward_cap?.scope ?? null,
        };
      }
    }

    let bestVoucher: BestVoucher | null = null;
    for (const r of rulesInCat) {
      if (!r.merchant) continue;
      const rw = r.reward;
      if (rw.voucher_reward_percentage <= 0) continue;
      const total =
        rw.voucher_discount_percentage +
        rw.voucher_reward_percentage -
        rw.convenience_fee_percentage;
      if (!bestVoucher || total > bestVoucher.totalPercentage) {
        const monthlyLimit = r.caps.voucher_monthly_purchase_limit_inr;
        bestVoucher = {
          merchant: r.merchant,
          breakdown: {
            discount: rw.voucher_discount_percentage,
            reward: rw.voucher_reward_percentage,
            fee: rw.convenience_fee_percentage,
          },
          totalPercentage: total,
          cappedAnnualSpendInr: monthlyLimit !== null ? monthlyLimit * 12 : null,
          fallbackPercentage: baseRate,
        };
      }
    }

    if (!bestDirect && !bestVoucher) continue;

    results.push({
      _id: `bestof_${card._id.replace(/^card_/, "")}_${category}`,
      cardId: card._id,
      category,
      bestDirectSwipe: bestDirect,
      bestVoucher,
      rulesVersion,
      computedAt,
    });
  }

  return results;
}

export const MOCK_BEST_OF: MockBestOf[] = MOCK_CARDS.flatMap((card) =>
  computeBestOfForCard(card, MOCK_RULES, 1, new Date("2024-01-01")),
);
