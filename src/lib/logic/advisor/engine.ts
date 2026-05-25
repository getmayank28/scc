import {
  CATEGORIES,
  type Category,
  MOCK_CARDS,
  type MockCard,
} from "./cards";
import { MOCK_BEST_OF, type BestVoucher, type MockBestOf } from "./bestOf";
import { type CapPeriod, sharedCapGroupKey } from "./rules";

const PERIODS_PER_YEAR: Record<CapPeriod, number> = {
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
  type CategorySplit,
  type TravelCardPhaseOneInput,
  type TravelCardPhaseOneOutput,
} from "./travel";

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

function buildBestOfIndex(bestOfList: MockBestOf[]): Map<string, MockBestOf> {
  const index = new Map<string, MockBestOf>();
  for (const entry of bestOfList) {
    index.set(`${entry.cardId}::${entry.category}`, entry);
  }
  return index;
}

function returnWithCap(
  spend: number,
  effectivePct: number,
  cappedAnnualSpendInr: number | null,
  fallbackPct: number,
): number {
  if (cappedAnnualSpendInr === null || spend <= cappedAnnualSpendInr) {
    return (spend * effectivePct) / 100;
  }
  const cappedPortion = (cappedAnnualSpendInr * effectivePct) / 100;
  const overflowPortion = ((spend - cappedAnnualSpendInr) * fallbackPct) / 100;
  return cappedPortion + overflowPortion;
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

function computeVoucherReturn(
  spend: number,
  voucher: BestVoucher,
  purchaseCap: number | null,
  rewardCap: number | null,
): number {
  const { discount, reward, fee } = voucher.breakdown;
  const baseRate = voucher.fallbackPercentage;

  // V = voucher-covered spend (bounded by purchase ceilings)
  const V = purchaseCap === null ? spend : Math.min(spend, purchaseCap);
  const nonVoucherSpend = spend - V;

  // Reward portion splits at reward_cap: accelerated below, base above
  const acceleratedV = rewardCap === null ? V : Math.min(V, rewardCap);
  const overflowV = V - acceleratedV;

  return (
    (nonVoucherSpend * baseRate) / 100 +
    (V * discount) / 100 -
    (V * fee) / 100 +
    (acceleratedV * reward) / 100 +
    (overflowV * baseRate) / 100
  );
}

function computeCategoryReturn(
  spend: number,
  category: Category,
  card: MockCard,
  bestOf: MockBestOf | undefined,
  bookingsPerYear: number,
): CategoryReturn {
  const baseRate = card.rewards.base_reward_rate;
  const direct = bestOf?.bestDirectSwipe ?? null;
  const voucher = bestOf?.bestVoucher ?? null;

  const directRewardCap = direct
    ? tripAwareAnnualCapInr(
        direct.cappedSpendPerPeriodInr,
        direct.capPeriod,
        bookingsPerYear,
      )
    : null;

  const directReturn = direct
    ? returnWithCap(
        spend,
        direct.percentage,
        directRewardCap,
        direct.fallbackPercentage,
      )
    : (spend * baseRate) / 100;

  const avgBookingInr = bookingsPerYear > 0 ? spend / bookingsPerYear : 0;
  const voucherCap = voucher
    ? voucherAnnualCap(voucher, bookingsPerYear, avgBookingInr)
    : null;
  const voucherRewardCap = voucher
    ? tripAwareAnnualCapInr(
        voucher.caps.rewardSpendPerPeriodInr,
        voucher.capPeriod,
        bookingsPerYear,
      )
    : null;

  const voucherReturn = voucher
    ? computeVoucherReturn(spend, voucher, voucherCap, voucherRewardCap)
    : null;

  if (voucher && voucherReturn !== null && voucherReturn >= directReturn) {
    return withEffectiveRate({
      category,
      spend,
      effectivePercentage: voucher.totalPercentage,
      source: "voucher",
      merchant: voucher.merchant,
      capNote: buildVoucherCapNote(voucherCap, voucherRewardCap),
      cappedAnnualSpendInr: voucherCap,
      returnInr: voucherReturn,
    });
  }

  if (direct) {
    return withEffectiveRate({
      category,
      spend,
      effectivePercentage: direct.percentage,
      source: "direct",
      merchant: direct.merchant,
      capNote: direct.capNote,
      cappedAnnualSpendInr: directRewardCap,
      returnInr: directReturn,
    });
  }

  return withEffectiveRate({
    category,
    spend,
    effectivePercentage: baseRate,
    source: "fallback",
    merchant: null,
    capNote: null,
    cappedAnnualSpendInr: null,
    returnInr: directReturn,
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
  rewardCapAnnualValueInr: number;
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
      if (!v || !v.sharedCapGroup) continue;
      const rewardCapAnnualValueInr = tripAwareAnnualCapInr(
        v.rewardCapPerPeriodValueInr,
        v.capPeriod,
        tripsPerYearForGroup,
      );
      if (rewardCapAnnualValueInr === null) continue;
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
        rewardCapAnnualValueInr,
      });
    } else {
      const d = bestOf.bestDirectSwipe;
      if (!d || !d.sharedCapGroup) continue;
      const rewardCapAnnualValueInr = tripAwareAnnualCapInr(
        d.rewardCapPerPeriodValueInr,
        d.capPeriod,
        tripsPerYearForGroup,
      );
      if (rewardCapAnnualValueInr === null) continue;
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
        rewardCapAnnualValueInr,
      });
    }
  }
  return out;
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
  tripsPerYear: number,
): { domestic: SegmentReturn; international: SegmentReturn } {
  // Shared cap pools span categories (and sometimes segments) on the same card,
  // so the cap is consumed by total trips across the year, not per-segment.
  const participants = [
    ...collectSharedCapParticipants(cardId, "domestic", domestic, index, tripsPerYear),
    ...collectSharedCapParticipants(
      cardId,
      "international",
      international,
      index,
      tripsPerYear,
    ),
  ];

  const byGroup = new Map<string, SharedCapParticipant[]>();
  for (const p of participants) {
    const cat =
      p.segment === "domestic"
        ? domestic[p.category as keyof Pick<SegmentReturn, "flights" | "hotels" | "other">]
        : international[p.category as keyof Pick<SegmentReturn, "flights" | "hotels" | "other">];
    // grouping key comes from the rule (we re-derive from bestOf via best-of lookup); reuse via index
    const bestOf = index.get(`${cardId}::${cat.category}`);
    const group =
      cat.source === "voucher"
        ? bestOf?.bestVoucher?.sharedCapGroup
        : bestOf?.bestDirectSwipe?.sharedCapGroup;
    if (!group) continue;
    const key = sharedCapGroupKey(group);
    const list = byGroup.get(key) ?? [];
    list.push(p);
    byGroup.set(key, list);
  }

  const overrides = new Map<string, number>();
  for (const members of byGroup.values()) {
    if (members.length <= 1) continue;
    const B = members[0].rewardCapAnnualValueInr;
    if (B <= 0) continue;

    const sorted = [...members].sort((a, b) => b.rate - a.rate);
    let remaining = B;
    for (const m of sorted) {
      const potential = (m.coveredSpend * m.rate) / 100;
      const accelerated = Math.min(potential, remaining);
      overrides.set(
        `${m.segment}::${m.category}`,
        participantReturn(m, accelerated),
      );
      remaining = Math.max(0, remaining - accelerated);
    }
  }

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
  cards: MockCard[] = MOCK_CARDS,
  bestOfList: MockBestOf[] = MOCK_BEST_OF,
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
        input.tripsPerYear,
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
