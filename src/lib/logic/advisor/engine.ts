import { CATEGORIES, type Category, type MockCard } from "./cards";
import {
  type BestDirectSwipe,
  type BestVoucher,
  type MockBestOf,
  type SharedCapPool,
} from "./bestOf";
import {
  isTotalCapGroup,
  type CapPeriod,
  type DirectSwipeSchedule,
} from "./rules";

const PERIODS_PER_YEAR: Record<CapPeriod, number> = {
  daily: 365,
  monthly: 12,
  quarterly: 4,
  annually: 1,
};

// Travel bookings are lumpy: all of a trip's spend lands inside a single cap
// period. So the annual accelerated headroom is the per-period cap repeated
// across however many *cap periods actually contain a trip*. For monthly caps
// that's min(trips/yr, 12); quarterly is min(trips, 4); annually min(trips, 1).
function tripAwareAnnualCapInr(
  perPeriodInr: number | null,
  period: CapPeriod | null,
  tripsPerYear: number,
): number | null {
  if (perPeriodInr === null || period === null) return null;
  const periodsPerYear = PERIODS_PER_YEAR[period];
  const activePeriods = Math.min(tripsPerYear, periodsPerYear);
  return perPeriodInr * activePeriods;
}
import {
  travelCardPhaseOneRecommendation,
  travelCardPhaseTwoRecommendation,
  type CategorySplit,
  type TravelCardPhaseOneInput,
  type TravelCardPhaseOneOutput,
  type TravelCardPhaseTwoInput,
  type TravelCardPhaseTwoOutput,
  type TravelPriority,
} from "./travel";

// Forex filter: applies only when foreign travel exceeds this share of trips,
// and eliminates cards whose markup (including GST) is above the ceiling.
const LOW_FOREX_MIN_INTL_PERCENTAGE = 40;
const LOW_FOREX_GST_MULTIPLIER = 1.18;
const LOW_FOREX_MAX_WITH_GST_PERCENTAGE = 2.36;

// Lounge filter: total free annual visits must cover at least this fraction of
// `trips × 1.5`.
const LOUNGE_TRIPS_MULTIPLIER = 1.5;
const LOUNGE_MIN_COVERAGE_RATIO = 0.3;

export type ReturnSource = "voucher" | "direct" | "fallback";

export interface CategoryReturn {
  category: Category;
  spend: number;
  effectivePercentage: number;
  effectiveRateAfterCap: number;
  source: ReturnSource;
  merchant: string | null;
  capNote: string | null;
  cappedAnnualSpendInr: number | null;
  returnInr: number;
}

function withEffectiveRate(
  cat: Omit<CategoryReturn, "effectiveRateAfterCap">,
): CategoryReturn {
  return {
    ...cat,
    effectiveRateAfterCap: cat.spend > 0 ? (cat.returnInr / cat.spend) * 100 : 0,
  };
}

export interface SegmentReturn {
  flights: CategoryReturn;
  hotels: CategoryReturn;
  other: CategoryReturn;
  totalSpend: number;
  totalReturnInr: number;
}

export interface ForexReturn {
  applicableSpend: number;
  markupPercentage: number;
  gstPercentage: number;
  markupCostInr: number;
  gstOnMarkupInr: number;
  totalCostInr: number;
}

export interface CardTravelReturn {
  cardId: string;
  cardName: string;
  domestic: SegmentReturn;
  international: SegmentReturn;
  extraFlights: SegmentReturn | null;
  forex: ForexReturn;
  grossReturnInr: number;
  netReturnInr: number;
}

export interface TravelEngineResult {
  input: TravelCardPhaseOneInput;
  travel: TravelCardPhaseOneOutput;
  byCard: CardTravelReturn[];
  best: CardTravelReturn | null;
}

export interface TravelEngineAdvancedResult {
  input: TravelCardPhaseTwoInput;
  travel: TravelCardPhaseTwoOutput;
  byCard: CardTravelReturn[];
  best: CardTravelReturn | null;
  filteredCardCount: number;
  totalCardCount: number;
}

function buildBestOfIndex(bestOfList: MockBestOf[]): Map<string, MockBestOf> {
  const index = new Map<string, MockBestOf>();
  for (const entry of bestOfList) {
    index.set(`${entry.cardId}::${entry.category}`, entry);
  }
  return index;
}

// The single pool a direct candidate draws from, for waterfall cap accounting.
// A `combined` candidate draws from the shared pool keyed by its group; every
// other candidate gets a private pool. In both cases the budget is the rule's
// own reward cap (combined members are validated to agree on it).
interface CandidatePool {
  key: string;
  capPeriod: CapPeriod | null;
}

function directCandidatePool(c: BestDirectSwipe): CandidatePool {
  if (c.sharedCapPool) {
    return { key: `shared::${c.sharedCapPool.key}`, capPeriod: c.sharedCapPool.capPeriod };
  }
  return {
    key: `unshared::${c.merchant ?? "base"}::${c.percentage}::${
      c.cappedSpendPerPeriodInr ?? "null"
    }`,
    capPeriod: c.capPeriod,
  };
}

interface DirectWaterfallResult {
  totalInr: number;
  primary: BestDirectSwipe | null;
}

// Annual spend threshold for a tier's per-period floor, annualized the same way
// reward caps are (so tier thresholds and caps stay consistent). A 0 floor maps
// to 0 (the first tier always applies from the bottom).
function tierAnnualThreshold(
  perPeriodInr: number,
  schedule: DirectSwipeSchedule,
  bookingsPerYear: number,
): number {
  return (
    tripAwareAnnualCapInr(perPeriodInr, schedule.period, bookingsPerYear) ?? 0
  );
}

// "whole" mode: the highest tier whose annual threshold the spend reaches sets
// one rate applied to ALL the spend.
function resolveWholeRate(
  schedule: DirectSwipeSchedule,
  spend: number,
  bookingsPerYear: number,
): number {
  let rate = schedule.tiers[0]?.rate ?? 0;
  for (const t of schedule.tiers) {
    const threshold = tierAnnualThreshold(
      t.min_spend_per_period_inr,
      schedule,
      bookingsPerYear,
    );
    if (spend >= threshold) rate = t.rate;
  }
  return rate;
}

// "marginal" mode: each spend slice [tier_k, tier_k+1) earns tier_k's rate. The
// rule's reward_cap (if any) ceilings the accelerated reward in spend order;
// once it's exhausted, the remaining spend earns the base rate.
function marginalTieredInr(
  c: BestDirectSwipe,
  spend: number,
  baseRate: number,
  bookingsPerYear: number,
): number {
  const schedule = c.schedule!;
  const tiers = schedule.tiers;
  const annualCap =
    tripAwareAnnualCapInr(
      c.rewardCapPerPeriodValueInr,
      c.capPeriod,
      bookingsPerYear,
    ) ?? Number.POSITIVE_INFINITY;

  let total = 0;
  let rewardSoFar = 0;
  let baseSpend = 0;
  let capReached = false;
  for (let i = 0; i < tiers.length; i++) {
    const lo = tierAnnualThreshold(
      tiers[i].min_spend_per_period_inr,
      schedule,
      bookingsPerYear,
    );
    const hi =
      i + 1 < tiers.length
        ? tierAnnualThreshold(
            tiers[i + 1].min_spend_per_period_inr,
            schedule,
            bookingsPerYear,
          )
        : Number.POSITIVE_INFINITY;
    const slice = Math.max(0, Math.min(spend, hi) - lo);
    if (slice <= 0) continue;

    if (capReached) {
      baseSpend += slice;
      continue;
    }
    const rate = tiers[i].rate;
    const capHeadroom = annualCap - rewardSoFar;
    const maxSliceByCap = rate > 0 ? (capHeadroom * 100) / rate : slice;
    const accelSlice = Math.min(slice, maxSliceByCap);
    const earned = (accelSlice * rate) / 100;
    total += earned;
    rewardSoFar += earned;
    baseSpend += slice - accelSlice;
    if (accelSlice < slice) capReached = true;
  }
  total += (baseSpend * baseRate) / 100;
  return total;
}

// Flat waterfall: drain spend top-down through the candidates (highest rate
// first), respecting per-rule and shared-pool caps; leftover falls to base.
function flatWaterfallInr(
  spend: number,
  candidates: BestDirectSwipe[],
  baseRate: number,
  bookingsPerYear: number,
): DirectWaterfallResult {
  const sorted = [...candidates].sort((a, b) => b.percentage - a.percentage);

  // Resolve each pool's annual reward budget once (first candidate to claim the
  // key sets it; shared-pool members agree on their reward cap by validation).
  const poolCapReward = new Map<string, number>();
  for (const c of sorted) {
    const pool = directCandidatePool(c);
    if (poolCapReward.has(pool.key)) continue;
    const annual = tripAwareAnnualCapInr(
      c.rewardCapPerPeriodValueInr,
      pool.capPeriod,
      bookingsPerYear,
    );
    poolCapReward.set(pool.key, annual ?? Number.POSITIVE_INFINITY);
  }
  const poolUsedReward = new Map<string, number>();

  let remaining = spend;
  let totalInr = 0;
  let primary: BestDirectSwipe | null = null;

  for (const c of sorted) {
    if (remaining <= 0) break;
    if (c.percentage <= 0) continue;
    const pool = directCandidatePool(c);
    const headroom = poolCapReward.get(pool.key)! - (poolUsedReward.get(pool.key) ?? 0);
    if (headroom <= 0) continue;
    const maxSpend = (headroom * 100) / c.percentage;
    const absorbed = Math.min(remaining, maxSpend);
    if (absorbed <= 0) continue;
    const earned = (absorbed * c.percentage) / 100;
    totalInr += earned;
    remaining -= absorbed;
    poolUsedReward.set(pool.key, (poolUsedReward.get(pool.key) ?? 0) + earned);
    if (!primary) primary = c;
  }

  totalInr += (remaining * baseRate) / 100;
  return { totalInr, primary };
}

// Resolve the direct frontier including spend-tiered rules:
//   - flat rules + "whole" tiers (pre-resolved to a single rate) go through the
//     flat waterfall, exactly as before;
//   - each "marginal" tiered rule is evaluated piecewise over the full category
//     spend (it covers all of it), and the best-earning structure is chosen.
// With no tiered rules present this reduces to the flat waterfall verbatim.
function directWaterfallInr(
  spend: number,
  directFrontier: BestDirectSwipe[],
  baseTier: BestDirectSwipe | null,
  baseRate: number,
  bookingsPerYear: number,
): DirectWaterfallResult {
  const all: BestDirectSwipe[] = [...directFrontier];
  if (baseTier) all.push(baseTier);

  // "whole" tiers depend only on total spend → resolve to a flat-rate copy.
  const resolved = all.map((c) =>
    c.schedule && c.schedule.mode === "whole"
      ? {
          ...c,
          percentage: resolveWholeRate(c.schedule, spend, bookingsPerYear),
          schedule: null,
        }
      : c,
  );

  const marginal = resolved.filter(
    (c) => c.schedule && c.schedule.mode === "marginal",
  );
  const flat = resolved.filter((c) => !c.schedule);

  let best = flatWaterfallInr(spend, flat, baseRate, bookingsPerYear);
  for (const m of marginal) {
    const totalInr = marginalTieredInr(m, spend, baseRate, bookingsPerYear);
    if (totalInr > best.totalInr) best = { totalInr, primary: m };
  }
  return best;
}

interface VoucherWaterfallResult {
  totalInr: number;
  primary: BestVoucher | null;
}

// Voucher lane: top-totalPercentage voucher absorbs spend up to its annual
// purchase cap, next voucher absorbs the next slice, etc. Spend that can't be
// routed through any voucher spills into the *direct* waterfall (not the card
// base rate) — this is the key correctness fix vs. the old single-rule lane.
function voucherWaterfallInr(
  spend: number,
  voucherFrontier: BestVoucher[],
  directFrontier: BestDirectSwipe[],
  baseTier: BestDirectSwipe | null,
  baseRate: number,
  bookingsPerYear: number,
): VoucherWaterfallResult {
  const sorted = [...voucherFrontier].sort(
    (a, b) => b.totalPercentage - a.totalPercentage,
  );
  // avgBookingInr derived from full spend matches the legacy single-voucher
  // model — keeps voucher cap math consistent across the waterfall.
  const avgBookingInr = bookingsPerYear > 0 ? spend / bookingsPerYear : 0;

  let remaining = spend;
  let totalInr = 0;
  let primary: BestVoucher | null = null;

  for (const v of sorted) {
    if (remaining <= 0) break;
    const purchaseCap = voucherAnnualCap(v, bookingsPerYear, avgBookingInr);
    const absorbed =
      purchaseCap === null ? remaining : Math.min(remaining, purchaseCap);
    if (absorbed <= 0) continue;

    const rewardCap = tripAwareAnnualCapInr(
      v.caps.rewardSpendPerPeriodInr,
      v.capPeriod,
      bookingsPerYear,
    );
    const acceleratedV = rewardCap === null ? absorbed : Math.min(absorbed, rewardCap);
    const overflowV = absorbed - acceleratedV;

    const earned =
      (absorbed * v.breakdown.discount) / 100 -
      (absorbed * v.breakdown.fee) / 100 +
      (acceleratedV * v.breakdown.reward) / 100 +
      (overflowV * baseRate) / 100;

    totalInr += earned;
    remaining -= absorbed;
    if (!primary) primary = v;
  }

  if (remaining > 0) {
    const spill = directWaterfallInr(
      remaining,
      directFrontier,
      baseTier,
      baseRate,
      bookingsPerYear,
    );
    totalInr += spill.totalInr;
  }

  return { totalInr, primary };
}

function voucherAnnualCap(
  voucher: BestVoucher,
  bookingsPerYear: number,
  avgBookingInr: number,
): number | null {
  const { maxVoucherInr, perBooking, monthlyPurchaseInr } = voucher.caps;

  const perBookingCeiling =
    maxVoucherInr !== null && perBooking !== null
      ? maxVoucherInr * perBooking
      : null;

  const annualFromBookings =
    perBookingCeiling !== null
      ? bookingsPerYear * Math.min(avgBookingInr, perBookingCeiling)
      : null;

  const annualFromMonthly =
    monthlyPurchaseInr !== null ? monthlyPurchaseInr * 12 : null;

  if (annualFromBookings === null && annualFromMonthly === null) return null;
  if (annualFromBookings === null) return annualFromMonthly;
  if (annualFromMonthly === null) return annualFromBookings;
  return Math.min(annualFromBookings, annualFromMonthly);
}

function formatInr(value: number): string {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

function buildVoucherCapNote(
  purchaseCap: number | null,
  rewardCap: number | null,
): string | null {
  const parts: string[] = [];
  if (purchaseCap !== null) {
    parts.push(`voucher covers ${formatInr(purchaseCap)}/yr`);
  }
  if (rewardCap !== null && (purchaseCap === null || rewardCap < purchaseCap)) {
    parts.push(`accelerated reward to ${formatInr(rewardCap)}/yr`);
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function computeCategoryReturn(
  spend: number,
  category: Category,
  card: MockCard,
  bestOf: MockBestOf | undefined,
  bookingsPerYear: number,
): CategoryReturn {
  const baseRate = card.rewards.base_reward_rate;
  const directFrontier = bestOf?.directFrontier ?? [];
  const voucherFrontier = bestOf?.voucherFrontier ?? [];
  const baseTier = bestOf?.baseTier ?? null;

  // When the category's catch-all (the merchant-null base tier) is a `total`
  // group, spend that overflows its cap earns nothing — so the waterfall's
  // trailing floor is 0 instead of the card base rate. Every other case keeps
  // the card base rate.
  const floorRate = isTotalCapGroup(baseTier?.sharedCapGroup) ? 0 : baseRate;

  const directResult = directWaterfallInr(
    spend,
    directFrontier,
    baseTier,
    floorRate,
    bookingsPerYear,
  );

  const voucherResult =
    voucherFrontier.length > 0
      ? voucherWaterfallInr(
          spend,
          voucherFrontier,
          directFrontier,
          baseTier,
          floorRate,
          bookingsPerYear,
        )
      : null;

  if (
    voucherResult &&
    voucherResult.primary &&
    voucherResult.totalInr >= directResult.totalInr
  ) {
    const v = voucherResult.primary;
    const avgBookingInr = bookingsPerYear > 0 ? spend / bookingsPerYear : 0;
    const voucherCap = voucherAnnualCap(v, bookingsPerYear, avgBookingInr);
    const voucherRewardCap = tripAwareAnnualCapInr(
      v.caps.rewardSpendPerPeriodInr,
      v.capPeriod,
      bookingsPerYear,
    );
    return withEffectiveRate({
      category,
      spend,
      effectivePercentage: v.totalPercentage,
      source: "voucher",
      merchant: v.merchant,
      capNote: buildVoucherCapNote(voucherCap, voucherRewardCap),
      cappedAnnualSpendInr: voucherCap,
      returnInr: voucherResult.totalInr,
    });
  }

  if (directResult.primary) {
    const d = directResult.primary;
    const directRewardCap = tripAwareAnnualCapInr(
      d.cappedSpendPerPeriodInr,
      d.capPeriod,
      bookingsPerYear,
    );
    return withEffectiveRate({
      category,
      spend,
      effectivePercentage: d.percentage,
      source: "direct",
      merchant: d.merchant,
      capNote: d.capNote,
      cappedAnnualSpendInr: directRewardCap,
      returnInr: directResult.totalInr,
    });
  }

  return withEffectiveRate({
    category,
    spend,
    effectivePercentage: floorRate,
    source: "fallback",
    merchant: null,
    capNote: null,
    cappedAnnualSpendInr: null,
    returnInr: directResult.totalInr,
  });
}

function buildSegment(
  spend: CategorySplit,
  card: MockCard,
  index: Map<string, MockBestOf>,
  bookingsPerYear: number,
): SegmentReturn {
  const flights = computeCategoryReturn(
    spend.flights,
    CATEGORIES.FLIGHTS,
    card,
    index.get(`${card._id}::${CATEGORIES.FLIGHTS}`),
    bookingsPerYear,
  );
  const hotels = computeCategoryReturn(
    spend.hotels,
    CATEGORIES.HOTELS,
    card,
    index.get(`${card._id}::${CATEGORIES.HOTELS}`),
    bookingsPerYear,
  );
  const other = computeCategoryReturn(
    spend.other,
    CATEGORIES.OTHER,
    card,
    index.get(`${card._id}::${CATEGORIES.OTHER}`),
    bookingsPerYear,
  );

  return {
    flights,
    hotels,
    other,
    totalSpend: spend.flights + spend.hotels + spend.other,
    totalReturnInr: flights.returnInr + hotels.returnInr + other.returnInr,
  };
}

interface ParticipantPool {
  key: string;
  budgetAnnualInr: number;
}

interface SharedCapParticipant {
  segment: "domestic" | "international";
  category: Category;
  source: "direct" | "voucher";
  spend: number;
  coveredSpend: number;
  rate: number;
  baseRate: number;
  discount: number;
  fee: number;
  pool: ParticipantPool;
}

// Resolve the combined pool (with annual budget) a candidate participates in.
// Only `combined` candidates carry a `sharedCapPool`; the budget derives from
// the rule's own reward cap. Returns null when there is no pool or no cap.
function annualParticipantPool(
  candidate: {
    sharedCapPool: SharedCapPool | null;
    rewardCapPerPeriodValueInr: number | null;
  },
  trips: number,
): ParticipantPool | null {
  const p = candidate.sharedCapPool;
  if (!p) return null;
  const annual = tripAwareAnnualCapInr(
    candidate.rewardCapPerPeriodValueInr,
    p.capPeriod,
    trips,
  );
  if (annual === null) return null;
  return { key: p.key, budgetAnnualInr: annual };
}

function collectSharedCapParticipants(
  cardId: string,
  segLabel: "domestic" | "international",
  segment: SegmentReturn,
  index: Map<string, MockBestOf>,
  tripsPerYearForGroup: number,
): SharedCapParticipant[] {
  const out: SharedCapParticipant[] = [];
  for (const cat of [segment.flights, segment.hotels, segment.other]) {
    if (cat.source === "fallback") continue;
    const bestOf = index.get(`${cardId}::${cat.category}`);
    if (!bestOf) continue;

    if (cat.source === "voucher") {
      const v = bestOf.bestVoucher;
      if (!v) continue;
      const pool = annualParticipantPool(v, tripsPerYearForGroup);
      if (!pool) continue;
      // cat.cappedAnnualSpendInr was set to the voucher purchase cap in
      // computeCategoryReturn — reuse rather than recomputing voucherAnnualCap.
      const coveredSpend =
        cat.cappedAnnualSpendInr === null
          ? cat.spend
          : Math.min(cat.spend, cat.cappedAnnualSpendInr);
      out.push({
        segment: segLabel,
        category: cat.category,
        source: "voucher",
        spend: cat.spend,
        coveredSpend,
        rate: v.breakdown.reward,
        baseRate: v.fallbackPercentage,
        discount: v.breakdown.discount,
        fee: v.breakdown.fee,
        pool,
      });
    } else {
      const d = bestOf.bestDirectSwipe;
      if (!d) continue;
      const pool = annualParticipantPool(d, tripsPerYearForGroup);
      if (!pool) continue;
      out.push({
        segment: segLabel,
        category: cat.category,
        source: "direct",
        spend: cat.spend,
        coveredSpend: cat.spend,
        rate: d.percentage,
        baseRate: d.fallbackPercentage,
        discount: 0,
        fee: 0,
        pool,
      });
    }
  }
  return out;
}

// Re-allocate each combined pool's annual budget across the categories that
// share it, top-down by rate. Returns overrides keyed by `${segLabel}::${cat}`.
// Lone members of a pool are left untouched (their per-category cap was already
// applied upstream); only genuinely shared pools (>1 member) are re-allocated.
function reallocateSharedPools(
  participants: SharedCapParticipant[],
  segLabelFor: (p: SharedCapParticipant) => string,
  overrides: Map<string, number>,
): void {
  const remaining = new Map<string, number>();
  const memberCount = new Map<string, number>();
  for (const p of participants) {
    memberCount.set(p.pool.key, (memberCount.get(p.pool.key) ?? 0) + 1);
    const prev = remaining.get(p.pool.key);
    remaining.set(
      p.pool.key,
      prev === undefined ? p.pool.budgetAnnualInr : Math.min(prev, p.pool.budgetAnnualInr),
    );
  }

  const toProcess = participants.filter(
    (p) => (memberCount.get(p.pool.key) ?? 0) > 1,
  );
  toProcess.sort((a, b) => b.rate - a.rate);

  for (const m of toProcess) {
    const potential = (m.coveredSpend * m.rate) / 100;
    const cap = remaining.get(m.pool.key) ?? Number.POSITIVE_INFINITY;
    const accelerated = Math.min(potential, cap);
    overrides.set(`${segLabelFor(m)}::${m.category}`, participantReturn(m, accelerated));
    remaining.set(m.pool.key, Math.max(0, (remaining.get(m.pool.key) ?? 0) - accelerated));
  }
}

function participantReturn(
  p: SharedCapParticipant,
  acceleratedValue: number,
): number {
  const spendAtRate = p.rate > 0 ? (acceleratedValue * 100) / p.rate : 0;
  const overflowSpend = Math.max(0, p.coveredSpend - spendAtRate);
  const nonCovered = Math.max(0, p.spend - p.coveredSpend);

  if (p.source === "direct") {
    return acceleratedValue + (overflowSpend * p.baseRate) / 100;
  }
  return (
    (nonCovered * p.baseRate) / 100 +
    (p.coveredSpend * p.discount) / 100 -
    (p.coveredSpend * p.fee) / 100 +
    acceleratedValue +
    (overflowSpend * p.baseRate) / 100
  );
}

function applySharedCapGroups(
  cardId: string,
  domestic: SegmentReturn,
  international: SegmentReturn,
  index: Map<string, MockBestOf>,
  domesticTrips: number,
  internationalTrips: number,
): { domestic: SegmentReturn; international: SegmentReturn } {
  // Shared cap pools are scoped per segment: each segment's pool size scales
  // with its own trip count, and pools are consumed independently. Within a
  // segment, participants still compete top-down by rate.
  const overrides = new Map<string, number>();

  const processSegment = (
    segLabel: "domestic" | "international",
    seg: SegmentReturn,
    trips: number,
  ) => {
    const participants = collectSharedCapParticipants(
      cardId,
      segLabel,
      seg,
      index,
      trips,
    );
    reallocateSharedPools(participants, (p) => p.segment, overrides);
  };

  processSegment("domestic", domestic, domesticTrips);
  processSegment("international", international, internationalTrips);

  const apply = (
    segLabel: "domestic" | "international",
    seg: SegmentReturn,
  ): SegmentReturn => {
    const upd = (cat: CategoryReturn): CategoryReturn => {
      const key = `${segLabel}::${cat.category}`;
      if (!overrides.has(key)) return cat;
      const returnInr = overrides.get(key)!;
      return withEffectiveRate({ ...cat, returnInr });
    };
    const flights = upd(seg.flights);
    const hotels = upd(seg.hotels);
    const other = upd(seg.other);
    return {
      flights,
      hotels,
      other,
      totalSpend: seg.totalSpend,
      totalReturnInr: flights.returnInr + hotels.returnInr + other.returnInr,
    };
  };

  return {
    domestic: apply("domestic", domestic),
    international: apply("international", international),
  };
}

function computeForexCost(
  applicableSpend: number,
  gstPercentage: number,
  markupPercentage: number,
): ForexReturn {
  const markupCostInr = (applicableSpend * markupPercentage) / 100;
  const gstOnMarkupInr = (markupCostInr * gstPercentage) / 100;
  return {
    applicableSpend,
    markupPercentage,
    gstPercentage,
    markupCostInr,
    gstOnMarkupInr,
    totalCostInr: markupCostInr + gstOnMarkupInr,
  };
}

export function recommendTravelCard(
  input: TravelCardPhaseOneInput,
  cards: MockCard[],
  bestOfList: MockBestOf[],
): TravelEngineResult {
  const travel = travelCardPhaseOneRecommendation(input);
  const index = buildBestOfIndex(bestOfList);

  const byCard = cards
    .filter((card) => card.is_active)
    .map<CardTravelReturn>((card) => {
      const rawDomestic = buildSegment(
        travel.categorySpend.domestic,
        card,
        index,
        travel.bookings.domestic,
      );
      const rawInternational = buildSegment(
        travel.categorySpend.international,
        card,
        index,
        travel.bookings.international,
      );
      const { domestic, international } = applySharedCapGroups(
        card._id,
        rawDomestic,
        rawInternational,
        index,
        travel.bookings.domestic,
        travel.bookings.international,
      );
      const forex = computeForexCost(
        travel.forex.applicableSpend,
        travel.forex.gstPercentage,
        card.forex_markup_percentage,
      );
      const grossReturnInr =
        domestic.totalReturnInr + international.totalReturnInr;
      return {
        cardId: card._id,
        cardName: card.name,
        domestic,
        international,
        extraFlights: null,
        forex,
        grossReturnInr,
        netReturnInr: grossReturnInr - forex.totalCostInr,
      };
    })
    .sort((a, b) => b.netReturnInr - a.netReturnInr);

  return {
    input,
    travel,
    byCard,
    best: byCard[0] ?? null,
  };
}

export function annualLoungeVisits(card: MockCard): number {
  const dom = card.lounge.domestic?.annualCap ?? 0;
  const intl = card.lounge.international?.annualCap ?? 0;
  return dom + intl;
}

export function loungeCoverageRatio(
  card: MockCard,
  tripsPerYear: number,
): number | null {
  if (tripsPerYear <= 0) return null;
  return annualLoungeVisits(card) / (tripsPerYear * LOUNGE_TRIPS_MULTIPLIER);
}

interface PriorityFilterContext {
  tripsPerYear: number;
  internationalPercentage: number;
}

function filterCardsByPriority(
  cards: MockCard[],
  priorities: TravelPriority[],
  ctx: PriorityFilterContext,
): MockCard[] {
  if (priorities.length === 0) return cards;
  return cards.filter((card) => {
    for (const p of priorities) {
      if (p === "maximumRewards") continue;
      if (p === "lowForex") {
        // Forex filter only applies when foreign travel exceeds the threshold.
        if (ctx.internationalPercentage <= LOW_FOREX_MIN_INTL_PERCENTAGE) continue;
        const effectiveForex =
          card.forex_markup_percentage * LOW_FOREX_GST_MULTIPLIER;
        if (effectiveForex > LOW_FOREX_MAX_WITH_GST_PERCENTAGE) return false;
      }
      if (p === "loungeAccess") {
        const ratio = loungeCoverageRatio(card, ctx.tripsPerYear);
        if (ratio !== null && ratio < LOUNGE_MIN_COVERAGE_RATIO) return false;
      }
    }
    return true;
  });
}

interface ThreeSegmentSharedCapEntry {
  label: "domestic" | "international" | "extraFlights";
  segment: SegmentReturn;
  tripsForGroup: number;
}

function applySharedCapGroupsMulti(
  cardId: string,
  segments: ThreeSegmentSharedCapEntry[],
  index: Map<string, MockBestOf>,
): Record<"domestic" | "international" | "extraFlights", SegmentReturn | null> {
  // Each segment (domestic / international / extraFlights) gets its own
  // shared-cap pool sized by that segment's own trip count. Within a segment,
  // participants in the same group still compete top-down by rate.
  const overrides = new Map<string, number>();
  for (const s of segments) {
    if (s.segment.totalSpend <= 0) continue;
    const participants = collectSharedCapParticipants(
      cardId,
      // segment field on participants is unused here; overrides are keyed by
      // this entry's label. Pools are scoped per segment (own remaining map).
      "domestic",
      s.segment,
      index,
      s.tripsForGroup,
    );
    reallocateSharedPools(participants, () => s.label, overrides);
  }

  const apply = (
    label: "domestic" | "international" | "extraFlights",
    seg: SegmentReturn,
  ): SegmentReturn => {
    const upd = (cat: CategoryReturn): CategoryReturn => {
      const key = `${label}::${cat.category}`;
      if (!overrides.has(key)) return cat;
      const returnInr = overrides.get(key)!;
      return withEffectiveRate({ ...cat, returnInr });
    };
    const flights = upd(seg.flights);
    const hotels = upd(seg.hotels);
    const other = upd(seg.other);
    return {
      flights,
      hotels,
      other,
      totalSpend: seg.totalSpend,
      totalReturnInr: flights.returnInr + hotels.returnInr + other.returnInr,
    };
  };

  const out: Record<
    "domestic" | "international" | "extraFlights",
    SegmentReturn | null
  > = { domestic: null, international: null, extraFlights: null };
  for (const s of segments) {
    out[s.label] = apply(s.label, s.segment);
  }
  return out;
}

export function recommendTravelCardAdvanced(
  input: TravelCardPhaseTwoInput,
  cards: MockCard[],
  bestOfList: MockBestOf[],
): TravelEngineAdvancedResult {
  const travel = travelCardPhaseTwoRecommendation(input);
  const index = buildBestOfIndex(bestOfList);

  const activeCards = cards.filter((c) => c.is_active);
  const filtered = filterCardsByPriority(activeCards, input.travelPriority, {
    tripsPerYear: input.tripsPerYear,
    internationalPercentage: travel.split.internationalPercentage,
  });

  const byCard = filtered
    .map<CardTravelReturn>((card) => {
      const rawDomestic = buildSegment(
        travel.categorySpend.domestic,
        card,
        index,
        travel.bookings.domestic,
      );
      const rawInternational = buildSegment(
        travel.categorySpend.international,
        card,
        index,
        travel.bookings.international,
      );
      const hasExtra = travel.additionalFlightSpend > 0;
      const rawExtra = hasExtra
        ? buildSegment(
            travel.categorySpend.extraFlights,
            card,
            index,
            travel.bookings.extraFlightsTrips,
          )
        : null;

      const segmentsForCap: ThreeSegmentSharedCapEntry[] = [
        {
          label: "domestic",
          segment: rawDomestic,
          tripsForGroup: travel.bookings.domestic,
        },
        {
          label: "international",
          segment: rawInternational,
          tripsForGroup: travel.bookings.international,
        },
      ];
      if (rawExtra) {
        segmentsForCap.push({
          label: "extraFlights",
          segment: rawExtra,
          tripsForGroup: travel.bookings.extraFlightsTrips,
        });
      }

      const adjusted = applySharedCapGroupsMulti(
        card._id,
        segmentsForCap,
        index,
      );

      const domestic = adjusted.domestic ?? rawDomestic;
      const international = adjusted.international ?? rawInternational;
      const extraFlights = rawExtra ? adjusted.extraFlights ?? rawExtra : null;

      const forex = computeForexCost(
        travel.forex.applicableSpend,
        travel.forex.gstPercentage,
        card.forex_markup_percentage,
      );

      const grossReturnInr =
        domestic.totalReturnInr +
        international.totalReturnInr +
        (extraFlights?.totalReturnInr ?? 0);

      return {
        cardId: card._id,
        cardName: card.name,
        domestic,
        international,
        extraFlights,
        forex,
        grossReturnInr,
        netReturnInr: grossReturnInr - forex.totalCostInr,
      };
    })
    .sort((a, b) => b.netReturnInr - a.netReturnInr);

  return {
    input,
    travel,
    byCard,
    best: byCard[0] ?? null,
    filteredCardCount: filtered.length,
    totalCardCount: activeCards.length,
  };
}
