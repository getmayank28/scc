import { type Category, type MockCard } from "./cards";
import {
  sharedCapGroupKey,
  voucherPoolKey,
  groupFallbackRate,
  CARD_LEVEL_CAP,
  TOTAL_LEVEL_CAP,
  CAP_PERIODS_PER_YEAR,
  type CapPeriod,
  type CapScope,
  type DirectSwipeSchedule,
  type Merchant,
  type MockRule,
  type SharedCapGroup,
} from "./rules";

// The combined pool a candidate belongs to. The budget always derives from the
// candidate's own reward_cap (`rewardCapPerPeriodValueInr`); this just carries
// the shared pool key and its period.
export interface SharedCapPool {
  key: string;
  capPeriod: CapPeriod | null;
}

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
  sharedCapPool: SharedCapPool | null;
  // Spend-tiered direct-swipe schedule (null = flat `percentage`). When set, the
  // engine resolves the effective rate against the spend that reaches this rule.
  schedule: DirectSwipeSchedule | null;
}

// The purchase-volume pool a voucher draws absorbed spend from, derived from a
// `purchase_inr` voucher_cap. `key` is the voucherPoolKey-namespaced shared
// pool key when the rule has a `combined` voucher_shared_cap_group, or null for
// a private (per-rule) purchase cap. The annual limit is a plain
// periods-per-year annualization (never trip-aware — purchase volume doesn't
// concentrate into trip periods the way accelerated rewards do).
export interface VoucherPurchasePool {
  key: string | null;
  annualLimitInr: number;
}

export interface BestVoucher {
  merchant: Merchant;
  breakdown: { discount: number; reward: number; fee: number };
  totalPercentage: number;
  // The same merchant's direct-swipe rate. Once the voucher's own cap is
  // exhausted, spend on this merchant overflows to this rate (never to another
  // merchant's voucher) — one merchant per hotel evaluation.
  directSwipePercentage: number;
  caps: {
    // Monthly purchase-volume cap, kept for display and for payloads written
    // before voucherPurchasePool existed (the engine falls back to ×12 on it).
    monthlyPurchaseInr: number | null;
    maxVoucherInr: number | null;
    perBooking: number | null;
    rewardSpendPerPeriodInr: number | null;
  };
  sharedCapGroup: SharedCapGroup | null;
  sharedCapPool: SharedCapPool | null;
  voucherPurchasePool: VoucherPurchasePool | null;
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
  daily: "day",
  monthly: "month",
  quarterly: "quarter",
  annually: "year",
};

function perPeriodSpendForCap(
  cap: MockRule["caps"]["reward_cap"],
  card: MockCard,
  ratePercentage: number,
): number | null {
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

function perPeriodValueForCap(
  cap: MockRule["caps"]["reward_cap"],
  card: MockCard,
): number | null {
  if (!cap) return null;
  const value =
    cap.metric === "points"
      ? cap.value * card.rewards.point_value_inr
      : cap.value;
  return Math.round(value);
}

function describeSharedCapGroup(group: SharedCapGroup): string {
  const parts: string[] = [];
  if (group.multiplier != null) parts.push(`${group.multiplier}X`);
  if (group.merchant === CARD_LEVEL_CAP) parts.push("card-wide");
  else if (group.merchant === TOTAL_LEVEL_CAP) parts.push("card-total (0 beyond cap)");
  else if (group.merchant != null) parts.push(group.merchant);
  return parts.length > 0 ? parts.join(" ") : "shared pool";
}

// The combined pool a rule belongs to, if any. Only `combined` groups pool with
// other rules; `standalone` (and groupless) rules keep a private cap (null). The
// budget always derives from the rule's own reward_cap in the engine.
function sharedCapPoolFor(r: MockRule): SharedCapPool | null {
  const g = r.shared_cap_group;
  if (!g || g.capType !== "combined") return null;
  return {
    key: sharedCapGroupKey(g),
    capPeriod: r.caps.reward_cap?.period ?? null,
  };
}

function capNoteFor(rule: MockRule): string | null {
  const cap = rule.caps.reward_cap;
  if (!cap) return null;
  const valueStr = cap.value.toLocaleString("en-IN");
  const metric = METRIC_LABEL[cap.metric];
  const period = PERIOD_LABEL[cap.period];
  const g = rule.shared_cap_group;
  const shared =
    g && g.capType === "combined"
      ? ` combined across ${describeSharedCapGroup(g)}`
      : "";
  return `${valueStr} ${metric}/${period}${shared}`;
}

// Normalize a schedule: keep it only when it has tiers; sort ascending so the
// engine can slice/threshold deterministically.
function scheduleFor(r: MockRule): DirectSwipeSchedule | null {
  const s = r.reward.direct_swipe_schedule;
  if (!s || !s.tiers || s.tiers.length === 0) return null;
  return {
    mode: s.mode,
    period: s.period,
    tiers: [...s.tiers].sort(
      (a, b) => a.min_spend_per_period_inr - b.min_spend_per_period_inr,
    ),
  };
}

// Exported for the spend optimizer, which resolves ONE merchant chosen by the
// user and so must build that merchant's candidate from the raw rule. The
// precomputed frontiers are Pareto-pruned for annual planning (~1.3 voucher
// merchants survive per card/category out of ~11 raw rules), which is correct
// when spend can be routed to the best merchant — but drops the merchant the
// user is actually paying.
export function buildDirectCandidate(
  r: MockRule,
  card: MockCard,
): BestDirectSwipe {
  const schedule = scheduleFor(r);
  // Headline rate: the top tier's rate for a tiered rule, else the flat rate.
  // Used only for frontier sorting/display; the engine resolves the real rate.
  const pct = schedule
    ? Math.max(...schedule.tiers.map((t) => t.rate))
    : r.reward.direct_swipe_percentage;
  return {
    merchant: r.merchant,
    percentage: pct,
    fallbackPercentage: groupFallbackRate(
      r.shared_cap_group,
      card.rewards.base_reward_rate,
    ),
    cappedSpendPerPeriodInr: perPeriodSpendForCap(r.caps.reward_cap, card, pct),
    rewardCapPerPeriodValueInr: perPeriodValueForCap(r.caps.reward_cap, card),
    capPeriod: r.caps.reward_cap?.period ?? null,
    capNote: capNoteFor(r),
    capScope: r.caps.reward_cap?.scope ?? null,
    sharedCapGroup: r.shared_cap_group,
    sharedCapPool: sharedCapPoolFor(r),
    schedule,
  };
}

// Exported alongside buildDirectCandidate — see the note there.
export function buildVoucherCandidate(r: MockRule, card: MockCard): BestVoucher {
  const rw = r.reward;
  const total =
    rw.voucher_discount_percentage +
    rw.voucher_reward_percentage -
    rw.convenience_fee_percentage;

  const vc = r.caps.voucher_cap;
  const vg = r.voucher_shared_cap_group;
  const vgCombined = vg && vg.capType === "combined" ? vg : null;

  // purchase_inr voucher_cap: clamps absorbed voucher spend (pooled across
  // rules when a combined voucher group is set). The reward side is untouched —
  // voucher rewards still budget against reward_cap / shared_cap_group.
  const purchaseCap = vc?.metric === "purchase_inr" ? vc : null;
  const voucherPurchasePool: VoucherPurchasePool | null = purchaseCap
    ? {
        key: vgCombined ? voucherPoolKey(vgCombined) : null,
        annualLimitInr:
          purchaseCap.value * CAP_PERIODS_PER_YEAR[purchaseCap.period],
      }
    : null;

  // Reward-metric voucher_cap: the voucher lane budgets against it (and pools
  // under the voucher group's namespaced key) instead of reward_cap +
  // shared_cap_group.
  const rewardVoucherCap =
    vc && vc.metric !== "purchase_inr"
      ? { period: vc.period, metric: vc.metric, value: vc.value, scope: vc.scope }
      : null;

  const laneCap = rewardVoucherCap ?? r.caps.reward_cap;
  const laneGroup = rewardVoucherCap ? (vg ?? null) : r.shared_cap_group;
  const lanePool: SharedCapPool | null = rewardVoucherCap
    ? vgCombined
      ? { key: voucherPoolKey(vgCombined), capPeriod: rewardVoucherCap.period }
      : null
    : sharedCapPoolFor(r);

  return {
    merchant: r.merchant as Merchant,
    breakdown: {
      discount: rw.voucher_discount_percentage,
      reward: rw.voucher_reward_percentage,
      fee: rw.convenience_fee_percentage,
    },
    totalPercentage: total,
    directSwipePercentage: rw.direct_swipe_percentage,
    caps: {
      monthlyPurchaseInr:
        purchaseCap && purchaseCap.period === "monthly"
          ? purchaseCap.value
          : null,
      maxVoucherInr: r.caps.max_voucher_size_inr,
      perBooking: r.caps.vouchers_per_booking,
      rewardSpendPerPeriodInr: perPeriodSpendForCap(
        laneCap,
        card,
        rw.voucher_reward_percentage,
      ),
    },
    sharedCapGroup: laneGroup,
    sharedCapPool: lanePool,
    voucherPurchasePool,
    rewardCapPerPeriodValueInr: perPeriodValueForCap(laneCap, card),
    capPeriod: laneCap?.period ?? null,
    fallbackPercentage: groupFallbackRate(
      laneGroup,
      card.rewards.base_reward_rate,
    ),
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
  // Tiered candidates earn a spend-dependent rate, so the flat-rate Pareto
  // domination below doesn't apply to them — keep them all, and exclude them
  // from dominating flat candidates. The engine resolves their real return.
  const tiered = candidates.filter((c) => c.schedule);
  const flat = candidates.filter((c) => !c.schedule);

  // Collapse candidates that belong to the exact same set of pools: they all
  // draw from identical budgets, so the top-rate one drains them first and the
  // rest add zero. Candidates with differing pool membership are independent
  // and kept. Candidates in no pool fall through to the unshared frontier.
  const sharedReps = new Map<string, BestDirectSwipe>();
  const unshared: BestDirectSwipe[] = [];
  for (const c of flat) {
    if (c.sharedCapPool) {
      const key = c.sharedCapPool.key;
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
  return [...tiered, ...sharedReps.values(), ...unsharedFrontier].sort(
    (a, b) => b.percentage - a.percentage,
  );
}

// Pareto-prune vouchers across (totalPercentage, annual purchase limit,
// maxVoucherInr × perBooking, rewardCapPerPeriodValueInr). null caps treated as
// infinity. Each surviving voucher is optimal in at least one cap regime.
// Candidates in different purchase pools draw from independent budgets, so
// neither can dominate the other regardless of the numbers.
function pruneVoucherFrontier(candidates: BestVoucher[]): BestVoucher[] {
  const purchasePoolKey = (v: BestVoucher) => v.voucherPurchasePool?.key ?? null;
  const score = (v: BestVoucher) => ({
    pct: v.totalPercentage,
    purchaseAnnual:
      v.voucherPurchasePool?.annualLimitInr ?? Number.POSITIVE_INFINITY,
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
        if (purchasePoolKey(o) !== purchasePoolKey(c)) return false;
        const os = score(o);
        if (
          os.pct < cs.pct ||
          os.purchaseAnnual < cs.purchaseAnnual ||
          os.perBookingVol < cs.perBookingVol ||
          os.rewardCap < cs.rewardCap
        ) {
          return false;
        }
        return (
          os.pct > cs.pct ||
          os.purchaseAnnual > cs.purchaseAnnual ||
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
      const candidate = buildDirectCandidate(r, card);
      // candidate.percentage is the flat rate, or a tiered rule's top-tier rate.
      const pct = candidate.percentage;
      if (pct <= baseRate) continue;
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
