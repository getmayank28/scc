import { type Category, type MockCard } from "./cards";
import {
  sharedCapGroupKey,
  type CapPeriod,
  type CapScope,
  type Merchant,
  type MockRule,
  type SharedCapGroup,
} from "./rules";

export interface BestDirectSwipe {
  // null only on the category-floor rule (baseTier). All frontier rules have
  // a concrete merchant.
  merchant: Merchant | null;
  percentage: number;
  fallbackPercentage: number;
  cappedSpendPerPeriodInr: number | null;
  rewardCapPerPeriodValueInr: number | null;
  capPeriod: CapPeriod | null;
  capNote: string | null;
  capScope: CapScope | null;
  sharedCapGroup: SharedCapGroup | null;
}

export interface BestVoucher {
  merchant: Merchant;
  breakdown: { discount: number; reward: number; fee: number };
  totalPercentage: number;
  caps: {
    monthlyPurchaseInr: number | null;
    maxVoucherInr: number | null;
    perBooking: number | null;
    rewardSpendPerPeriodInr: number | null;
  };
  sharedCapGroup: SharedCapGroup | null;
  rewardCapPerPeriodValueInr: number | null;
  capPeriod: CapPeriod | null;
  fallbackPercentage: number;
}

export interface MockBestOf {
  _id: string;
  cardId: string;
  category: Category;
  // Legacy: top-rate merchant rule and top-totalPct voucher. Kept verbatim so
  // existing consumers (shopping/food/allrounder + cross-category shared-cap
  // processor) keep working unchanged.
  bestDirectSwipe: BestDirectSwipe | null;
  bestVoucher: BestVoucher | null;
  // Pareto-undominated direct candidates (merchant-specific) sorted by rate
  // desc. Used by the waterfall in engine.ts to model multi-rule cap overflow.
  directFrontier: BestDirectSwipe[];
  // Pareto-undominated voucher candidates sorted by totalPercentage desc.
  voucherFrontier: BestVoucher[];
  // Category-wide floor rule (merchant === null) when it earns above the card
  // base rate. Feeds the direct waterfall as a final pre-base layer.
  baseTier: BestDirectSwipe | null;
  rulesVersion: number;
  computedAt: Date;
}

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

function perPeriodSpendForCap(
  rule: MockRule,
  card: MockCard,
  ratePercentage: number,
): number | null {
  const cap = rule.caps.reward_cap;
  if (!cap) return null;
  if (ratePercentage <= 0) return null;

  // points: spend × (rate/100) = points × point_value_inr
  // inr/cashback: spend × (rate/100) = cap_value
  const spend =
    cap.metric === "points"
      ? (cap.value * card.rewards.point_value_inr * 100) / ratePercentage
      : (cap.value * 100) / ratePercentage;

  return Math.round(spend);
}

function perPeriodValueForCap(rule: MockRule, card: MockCard): number | null {
  const cap = rule.caps.reward_cap;
  if (!cap) return null;
  const value =
    cap.metric === "points"
      ? cap.value * card.rewards.point_value_inr
      : cap.value;
  return Math.round(value);
}

function describeSharedCapGroup(group: SharedCapGroup): string {
  const parts: string[] = [];
  if (group.multiplier !== null) parts.push(`${group.multiplier}X`);
  if (group.merchant !== null) parts.push(group.merchant);
  return parts.length > 0 ? parts.join(" ") : "shared pool";
}

function capNoteFor(rule: MockRule): string | null {
  const cap = rule.caps.reward_cap;
  if (!cap) return null;
  const valueStr = cap.value.toLocaleString("en-IN");
  const metric = METRIC_LABEL[cap.metric];
  const period = PERIOD_LABEL[cap.period];
  const shared = rule.shared_cap_group
    ? ` combined across ${describeSharedCapGroup(rule.shared_cap_group)}`
    : "";
  return `${valueStr} ${metric}/${period}${shared}`;
}

function buildDirectCandidate(
  r: MockRule,
  card: MockCard,
): BestDirectSwipe {
  const pct = r.reward.direct_swipe_percentage;
  return {
    merchant: r.merchant,
    percentage: pct,
    fallbackPercentage: card.rewards.base_reward_rate,
    cappedSpendPerPeriodInr: perPeriodSpendForCap(r, card, pct),
    rewardCapPerPeriodValueInr: perPeriodValueForCap(r, card),
    capPeriod: r.caps.reward_cap?.period ?? null,
    capNote: capNoteFor(r),
    capScope: r.caps.reward_cap?.scope ?? null,
    sharedCapGroup: r.shared_cap_group,
  };
}

function buildVoucherCandidate(r: MockRule, card: MockCard): BestVoucher {
  const rw = r.reward;
  const total =
    rw.voucher_discount_percentage +
    rw.voucher_reward_percentage -
    rw.convenience_fee_percentage;
  return {
    merchant: r.merchant as Merchant,
    breakdown: {
      discount: rw.voucher_discount_percentage,
      reward: rw.voucher_reward_percentage,
      fee: rw.convenience_fee_percentage,
    },
    totalPercentage: total,
    caps: {
      monthlyPurchaseInr: r.caps.voucher_monthly_purchase_limit_inr,
      maxVoucherInr: r.caps.max_voucher_size_inr,
      perBooking: r.caps.vouchers_per_booking,
      rewardSpendPerPeriodInr: perPeriodSpendForCap(
        r,
        card,
        rw.voucher_reward_percentage,
      ),
    },
    sharedCapGroup: r.shared_cap_group,
    rewardCapPerPeriodValueInr: perPeriodValueForCap(r, card),
    capPeriod: r.caps.reward_cap?.period ?? null,
    fallbackPercentage: card.rewards.base_reward_rate,
  };
}

// Pareto-prune direct candidates:
// - Same shared_cap_group key: lower-rate is dominated (one pool, top rate
//   always drains it first — lower rate adds zero).
// - Different (or null) shared groups: independent pools, kept unless strictly
//   dominated on (rate, per-period reward cap) at the same cap period.
function pruneDirectFrontier(
  candidates: BestDirectSwipe[],
): BestDirectSwipe[] {
  const sharedReps = new Map<string, BestDirectSwipe>();
  const unshared: BestDirectSwipe[] = [];
  for (const c of candidates) {
    if (c.sharedCapGroup) {
      const key = sharedCapGroupKey(c.sharedCapGroup);
      const cur = sharedReps.get(key);
      if (!cur || c.percentage > cur.percentage) sharedReps.set(key, c);
    } else {
      unshared.push(c);
    }
  }
  const unsharedFrontier = unshared.filter((c) => {
    return !unshared.some((o) => {
      if (o === c) return false;
      if (o.capPeriod !== c.capPeriod) return false;
      const oCap = o.rewardCapPerPeriodValueInr ?? Number.POSITIVE_INFINITY;
      const cCap = c.rewardCapPerPeriodValueInr ?? Number.POSITIVE_INFINITY;
      return (
        o.percentage >= c.percentage &&
        oCap >= cCap &&
        (o.percentage > c.percentage || oCap > cCap)
      );
    });
  });
  return [...sharedReps.values(), ...unsharedFrontier].sort(
    (a, b) => b.percentage - a.percentage,
  );
}

// Pareto-prune vouchers across (totalPercentage, monthlyPurchaseInr,
// maxVoucherInr × perBooking, rewardCapPerPeriodValueInr). null caps treated as
// infinity. Each surviving voucher is optimal in at least one cap regime.
function pruneVoucherFrontier(candidates: BestVoucher[]): BestVoucher[] {
  const score = (v: BestVoucher) => ({
    pct: v.totalPercentage,
    monthly: v.caps.monthlyPurchaseInr ?? Number.POSITIVE_INFINITY,
    perBookingVol:
      (v.caps.maxVoucherInr ?? Number.POSITIVE_INFINITY) *
      (v.caps.perBooking ?? Number.POSITIVE_INFINITY),
    rewardCap: v.rewardCapPerPeriodValueInr ?? Number.POSITIVE_INFINITY,
  });
  return candidates
    .filter((c) => {
      const cs = score(c);
      return !candidates.some((o) => {
        if (o === c) return false;
        const os = score(o);
        if (
          os.pct < cs.pct ||
          os.monthly < cs.monthly ||
          os.perBookingVol < cs.perBookingVol ||
          os.rewardCap < cs.rewardCap
        ) {
          return false;
        }
        return (
          os.pct > cs.pct ||
          os.monthly > cs.monthly ||
          os.perBookingVol > cs.perBookingVol ||
          os.rewardCap > cs.rewardCap
        );
      });
    })
    .sort((a, b) => b.totalPercentage - a.totalPercentage);
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

    // Split direct candidates: merchant-specific rules feed the frontier; the
    // single best `merchant === null` rule (category floor) becomes baseTier.
    const merchantDirect: BestDirectSwipe[] = [];
    let baseTier: BestDirectSwipe | null = null;
    for (const r of rulesInCat) {
      const pct = r.reward.direct_swipe_percentage;
      if (pct <= baseRate) continue;
      const candidate = buildDirectCandidate(r, card);
      if (r.merchant === null) {
        if (!baseTier || pct > baseTier.percentage) baseTier = candidate;
      } else {
        merchantDirect.push(candidate);
      }
    }

    const directFrontier = pruneDirectFrontier(merchantDirect);
    // Legacy bestDirectSwipe: top-rate merchant rule. Matches old behavior
    // exactly because pruning preserves the top-rate rule.
    const bestDirect = directFrontier[0] ?? null;

    const voucherCandidates: BestVoucher[] = [];
    for (const r of rulesInCat) {
      if (!r.merchant) continue;
      if (r.reward.voucher_reward_percentage <= 0) continue;
      voucherCandidates.push(buildVoucherCandidate(r, card));
    }
    const voucherFrontier = pruneVoucherFrontier(voucherCandidates);
    // Legacy bestVoucher: top totalPercentage, preserved by sort order.
    const bestVoucher = voucherFrontier[0] ?? null;

    if (!bestDirect && !bestVoucher && !baseTier) continue;

    results.push({
      _id: `bestof_${card._id.replace(/^card_/, "")}_${category}`,
      cardId: card._id,
      category,
      bestDirectSwipe: bestDirect,
      bestVoucher,
      directFrontier,
      voucherFrontier,
      baseTier,
      rulesVersion,
      computedAt,
    });
  }

  return results;
}
