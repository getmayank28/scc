import { CATEGORIES, MOCK_CARDS, type Category, type MockCard } from "./cards";
import { MOCK_BEST_OF, computeBestOfForCard, type MockBestOf } from "./bestOf";
import { MERCHANTS, MOCK_RULES, type Merchant, type MockRule } from "./rules";
import { computeCategoryReturn, type CategoryReturn } from "./engine";

// ============================================================================
// Phase 1 — frequency-based food card recommendation
// ============================================================================
//
// Maps two frequency inputs (online food delivery, dining-out) plus a platform
// preference into a yearly spend distribution, then scores every active card by
// summing the per-stream returns. Steady monthly spend → bookings-per-year for
// cap accounting is 12.
//
// Per-bill assumptions (constants — tweak to recalibrate without touching the
// rest of the engine).
const AVG_DELIVERY_ORDER_INR = 700;
const AVG_DINING_BILL_INR = 2000;
const MONTHS_PER_YEAR = 12;
const ANNUAL_CAP_PERIODS = 12;

export type FoodPlatformPreference = "swiggy" | "zomato" | "both" | "none";

export interface FoodCardPhaseOneInput {
  // Monthly counts. Frontend exposes preset options (e.g. 1/6/16/25 and
  // 2/4/6/14) but the engine accepts any non-negative number.
  onlineFoodDeliveryFrequency: number;
  diningOutFrequency: number;
  foodDeliveryPlatformPreference: FoodPlatformPreference;
}

interface PlatformShares {
  swiggy: number;
  zomato: number;
  other: number;
}

// Fraction of the delivery pot that lands at each platform. "other" covers any
// share that doesn't match Swiggy/Zomato — it earns the card's category
// fallback rate, not an accelerator.
function platformShares(pref: FoodPlatformPreference): PlatformShares {
  switch (pref) {
    case "swiggy":
      return { swiggy: 0.75, zomato: 0, other: 0.25 };
    case "zomato":
      return { swiggy: 0, zomato: 0.75, other: 0.25 };
    case "both":
      return { swiggy: 0.5, zomato: 0.5, other: 0 };
    case "none":
      return { swiggy: 0, zomato: 0, other: 1 };
  }
}

export interface FoodSpendBreakdown {
  annualDeliverySpend: number;
  annualDiningSpend: number;
  annualTotal: number;
  // Annual rupee amounts after platform allocation. `offlineDining` is the
  // dining-out pot; the other three split the delivery pot.
  platformAllocation: {
    swiggy: number;
    zomato: number;
    other: number;
    offlineDining: number;
  };
}

export function buildFoodSpendBreakdown(
  input: FoodCardPhaseOneInput,
): FoodSpendBreakdown {
  const delivery =
    Math.max(0, input.onlineFoodDeliveryFrequency) *
    AVG_DELIVERY_ORDER_INR *
    MONTHS_PER_YEAR;
  const dining =
    Math.max(0, input.diningOutFrequency) *
    AVG_DINING_BILL_INR *
    MONTHS_PER_YEAR;
  const shares = platformShares(input.foodDeliveryPlatformPreference);
  return {
    annualDeliverySpend: delivery,
    annualDiningSpend: dining,
    annualTotal: delivery + dining,
    platformAllocation: {
      swiggy: delivery * shares.swiggy,
      zomato: delivery * shares.zomato,
      other: delivery * shares.other,
      offlineDining: dining,
    },
  };
}

// ============================================================================
// Per-card scoring
// ============================================================================

type FoodSubSpec =
  | {
      kind: "merchant";
      label: string;
      spend: number;
      category: Category;
      merchant: Merchant;
    }
  | {
      kind: "category-best";
      label: string;
      spend: number;
      category: Category;
    }
  | { kind: "fallback"; label: string; spend: number; category: Category };

export interface FoodSubReturn {
  label: string;
  spend: number;
  effectivePercentage: number;
  effectiveRateAfterCap: number;
  source: "voucher" | "direct" | "fallback";
  merchant: string | null;
  returnInr: number;
}

export interface FoodStreamReturn {
  spend: number;
  subs: FoodSubReturn[];
  returnInr: number;
}

export interface CardFoodReturn {
  cardId: string;
  cardName: string;
  delivery: FoodStreamReturn;
  dining: FoodStreamReturn;
  annualSpend: number;
  annualReturnInr: number;
  effectiveRatePercentage: number;
}

export interface FoodCardEngineResult {
  input: FoodCardPhaseOneInput;
  spend: FoodSpendBreakdown;
  byCard: CardFoodReturn[];
  best: CardFoodReturn | null;
}

function buildBestOfIndex(bestOfList: MockBestOf[]): Map<string, MockBestOf> {
  const index = new Map<string, MockBestOf>();
  for (const entry of bestOfList) {
    index.set(`${entry.cardId}::${entry.category}`, entry);
  }
  return index;
}

// Merchant-scoped best-of: reruns the best-of computation against just the
// merchant's rules. Returns undefined when the card has no rule for that
// merchant — caller falls back to base rate.
function merchantBestOf(
  card: MockCard,
  category: Category,
  merchant: Merchant,
  rules: MockRule[],
): MockBestOf | undefined {
  const subset = rules.filter(
    (r) =>
      r.cardId === card._id &&
      r.category === category &&
      r.merchant === merchant &&
      r.is_active,
  );
  if (subset.length === 0) return undefined;
  return computeBestOfForCard(card, subset)[0];
}

function diningFallbackRate(card: MockCard): number {
  if (card.excluded_categories?.includes(CATEGORIES.DINING)) return 0;
  return card.rewards.base_reward_rate;
}

function buildDeliverySpecs(spend: FoodSpendBreakdown): FoodSubSpec[] {
  const out: FoodSubSpec[] = [];
  const { swiggy, zomato, other } = spend.platformAllocation;
  if (swiggy > 0) {
    out.push({
      kind: "merchant",
      label: "Swiggy delivery",
      spend: swiggy,
      category: CATEGORIES.DINING,
      merchant: MERCHANTS.SWIGGY,
    });
  }
  if (zomato > 0) {
    out.push({
      kind: "merchant",
      label: "Zomato delivery",
      spend: zomato,
      category: CATEGORIES.DINING,
      merchant: MERCHANTS.ZOMATO,
    });
  }
  if (other > 0) {
    out.push({
      kind: "fallback",
      label: "Other delivery platforms",
      spend: other,
      category: CATEGORIES.DINING,
    });
  }
  return out;
}

function buildDiningSpecs(spend: FoodSpendBreakdown): FoodSubSpec[] {
  if (spend.platformAllocation.offlineDining <= 0) return [];
  // Offline dining doesn't pin to a specific merchant; spend earns the card's
  // dining base rate (or 0 if the card excludes dining).
  return [
    {
      kind: "fallback",
      label: "Offline dining",
      spend: spend.platformAllocation.offlineDining,
      category: CATEGORIES.DINING,
    },
  ];
}

function evaluateSpec(
  spec: FoodSubSpec,
  card: MockCard,
  index: Map<string, MockBestOf>,
  rules: MockRule[],
): FoodSubReturn {
  if (spec.kind === "fallback") {
    const rate = diningFallbackRate(card);
    return {
      label: spec.label,
      spend: spec.spend,
      effectivePercentage: rate,
      effectiveRateAfterCap: rate,
      source: "fallback",
      merchant: null,
      returnInr: (spec.spend * rate) / 100,
    };
  }

  const bestOf =
    spec.kind === "merchant"
      ? merchantBestOf(card, spec.category, spec.merchant, rules)
      : index.get(`${card._id}::${spec.category}`);

  const cat: CategoryReturn = computeCategoryReturn(
    spec.spend,
    spec.category,
    card,
    bestOf,
    ANNUAL_CAP_PERIODS,
  );

  // Same exclusion override as allrounder: when best-of falls through to the
  // base rate AND the card excludes the category, force 0%. Specific merchant
  // rules (direct/voucher) keep earning at their declared rate.
  const excluded =
    cat.source === "fallback" &&
    card.excluded_categories?.includes(spec.category) === true;

  return {
    label: spec.label,
    spend: spec.spend,
    effectivePercentage: excluded ? 0 : cat.effectivePercentage,
    effectiveRateAfterCap: excluded ? 0 : cat.effectiveRateAfterCap,
    source: cat.source,
    merchant: cat.merchant,
    returnInr: excluded ? 0 : cat.returnInr,
  };
}

function evaluateStream(
  specs: FoodSubSpec[],
  totalSpend: number,
  card: MockCard,
  index: Map<string, MockBestOf>,
  rules: MockRule[],
): FoodStreamReturn {
  const subs = specs.map((s) => evaluateSpec(s, card, index, rules));
  return {
    spend: totalSpend,
    subs,
    returnInr: subs.reduce((acc, s) => acc + s.returnInr, 0),
  };
}

function scoreCard(
  card: MockCard,
  spend: FoodSpendBreakdown,
  index: Map<string, MockBestOf>,
  rules: MockRule[],
): CardFoodReturn {
  const delivery = evaluateStream(
    buildDeliverySpecs(spend),
    spend.annualDeliverySpend,
    card,
    index,
    rules,
  );
  const dining = evaluateStream(
    buildDiningSpecs(spend),
    spend.annualDiningSpend,
    card,
    index,
    rules,
  );
  const annualReturnInr = delivery.returnInr + dining.returnInr;
  return {
    cardId: card._id,
    cardName: card.name,
    delivery,
    dining,
    annualSpend: spend.annualTotal,
    annualReturnInr,
    effectiveRatePercentage:
      spend.annualTotal > 0 ? (annualReturnInr / spend.annualTotal) * 100 : 0,
  };
}

export function recommendFoodCardPhaseOne(
  input: FoodCardPhaseOneInput,
  cards: MockCard[] = MOCK_CARDS,
  bestOfList: MockBestOf[] = MOCK_BEST_OF,
  rules: MockRule[] = MOCK_RULES,
): FoodCardEngineResult {
  const spend = buildFoodSpendBreakdown(input);
  const index = buildBestOfIndex(bestOfList);

  const byCard = cards
    .filter((c) => c.is_active)
    .map((card) => scoreCard(card, spend, index, rules))
    .sort((a, b) => b.annualReturnInr - a.annualReturnInr);

  return {
    input,
    spend,
    byCard,
    best: byCard[0] ?? null,
  };
}
