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
  // Collect participants across all provided segments. We reuse the existing
  // shared-cap mechanics but generalise the segment label so extra-flights
  // participates in the same pools.
  const allParticipants: (SharedCapParticipant & {
    segLabel: "domestic" | "international" | "extraFlights";
  })[] = [];
  for (const s of segments) {
    if (s.segment.totalSpend <= 0) continue;
    const ps = collectSharedCapParticipants(
      cardId,
      // collectSharedCapParticipants's `segment` field is a label only used
      // for override lookup; we override the label after the call.
      "domestic",
      s.segment,
      index,
      s.tripsForGroup,
    );
    for (const p of ps) {
      allParticipants.push({ ...p, segLabel: s.label });
    }
  }

  const byGroup = new Map<
    string,
    (SharedCapParticipant & { segLabel: "domestic" | "international" | "extraFlights" })[]
  >();
  for (const p of allParticipants) {
    const seg = segments.find((s) => s.label === p.segLabel)!.segment;
    const cat = seg[p.category as "flights" | "hotels" | "other"];
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
        `${m.segLabel}::${m.category}`,
        participantReturn(m, accelerated),
      );
      remaining = Math.max(0, remaining - accelerated);
    }
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
  cards: MockCard[] = MOCK_CARDS,
  bestOfList: MockBestOf[] = MOCK_BEST_OF,
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
            travel.bookings.extraFlightsSpreadMonths,
          )
        : null;

      const segmentsForCap: ThreeSegmentSharedCapEntry[] = [
        {
          label: "domestic",
          segment: rawDomestic,
          tripsForGroup: input.tripsPerYear,
        },
        {
          label: "international",
          segment: rawInternational,
          tripsForGroup: input.tripsPerYear,
        },
      ];
      if (rawExtra) {
        segmentsForCap.push({
          label: "extraFlights",
          segment: rawExtra,
          tripsForGroup: travel.bookings.extraFlightsSpreadMonths,
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
