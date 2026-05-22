import {
  CATEGORIES,
  type Category,
  MOCK_CARDS,
  type MockCard,
} from "./cards";
import { MOCK_BEST_OF, type MockBestOf } from "./bestOf";
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
  source: ReturnSource;
  merchant: string | null;
  capNote: string | null;
  cappedAnnualSpendInr: number | null;
  returnInr: number;
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

function computeCategoryReturn(
  spend: number,
  category: Category,
  card: MockCard,
  bestOf: MockBestOf | undefined,
): CategoryReturn {
  const baseRate = card.rewards.base_reward_rate;
  const direct = bestOf?.bestDirectSwipe ?? null;
  const voucher = bestOf?.bestVoucher ?? null;

  const directReturn = direct
    ? returnWithCap(
        spend,
        direct.percentage,
        direct.cappedAnnualSpendInr,
        direct.fallbackPercentage,
      )
    : (spend * baseRate) / 100;

  const voucherReturn = voucher
    ? returnWithCap(
        spend,
        voucher.totalPercentage,
        voucher.cappedAnnualSpendInr,
        voucher.fallbackPercentage,
      )
    : null;

  if (voucher && voucherReturn !== null && voucherReturn >= directReturn) {
    return {
      category,
      spend,
      effectivePercentage: voucher.totalPercentage,
      source: "voucher",
      merchant: voucher.merchant,
      capNote: null,
      cappedAnnualSpendInr: voucher.cappedAnnualSpendInr,
      returnInr: voucherReturn,
    };
  }

  if (direct) {
    return {
      category,
      spend,
      effectivePercentage: direct.percentage,
      source: "direct",
      merchant: direct.merchant,
      capNote: direct.capNote,
      cappedAnnualSpendInr: direct.cappedAnnualSpendInr,
      returnInr: directReturn,
    };
  }

  return {
    category,
    spend,
    effectivePercentage: baseRate,
    source: "fallback",
    merchant: null,
    capNote: null,
    cappedAnnualSpendInr: null,
    returnInr: directReturn,
  };
}

function buildSegment(
  spend: CategorySplit,
  card: MockCard,
  index: Map<string, MockBestOf>,
): SegmentReturn {
  const flights = computeCategoryReturn(
    spend.flights,
    CATEGORIES.FLIGHTS,
    card,
    index.get(`${card._id}::${CATEGORIES.FLIGHTS}`),
  );
  const hotels = computeCategoryReturn(
    spend.hotels,
    CATEGORIES.HOTELS,
    card,
    index.get(`${card._id}::${CATEGORIES.HOTELS}`),
  );
  const other = computeCategoryReturn(
    spend.other,
    CATEGORIES.OTHER,
    card,
    index.get(`${card._id}::${CATEGORIES.OTHER}`),
  );

  return {
    flights,
    hotels,
    other,
    totalSpend: spend.flights + spend.hotels + spend.other,
    totalReturnInr: flights.returnInr + hotels.returnInr + other.returnInr,
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
      const domestic = buildSegment(
        travel.categorySpend.domestic,
        card,
        index,
      );
      const international = buildSegment(
        travel.categorySpend.international,
        card,
        index,
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
