import { CATEGORIES, type Category, type MockCard } from "./cards";
import { computeBestOfForCard, type MockBestOf } from "./bestOf";
import { MERCHANTS, type Merchant, type MockRule } from "./rules";
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
  // Same platform shares apply to both pots: delivery splits across
  // Swiggy/Zomato/other-delivery; dining splits across Swiggy Dineout /
  // Zomato District (aggregator routes) and offline (the "other" share).
  deliveryAllocation: {
    swiggy: number;
    zomato: number;
    other: number;
  };
  diningAllocation: {
    swiggy: number;
    zomato: number;
    other: number;
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
    deliveryAllocation: {
      swiggy: delivery * shares.swiggy,
      zomato: delivery * shares.zomato,
      other: delivery * shares.other,
    },
    diningAllocation: {
      swiggy: dining * shares.swiggy,
      zomato: dining * shares.zomato,
      other: dining * shares.other,
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
  const { swiggy, zomato, other } = spend.deliveryAllocation;
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
  const out: FoodSubSpec[] = [];
  const { swiggy, zomato, other } = spend.diningAllocation;
  if (swiggy > 0) {
    out.push({
      kind: "merchant",
      label: "Swiggy dining",
      spend: swiggy,
      category: CATEGORIES.DINING,
      merchant: MERCHANTS.SWIGGY_DINEOUT,
    });
  }
  if (zomato > 0) {
    out.push({
      kind: "merchant",
      label: "Zomato dining",
      spend: zomato,
      category: CATEGORIES.DINING,
      merchant: MERCHANTS.ZOMATO_DISTRICT,
    });
  }
  if (other > 0) {
    // Leftover dining share after Swiggy/Zomato — paid directly at the
    // restaurant, earns the card's dining base rate (or 0 if excluded).
    out.push({
      kind: "fallback",
      label: "Offline dining",
      spend: other,
      category: CATEGORIES.DINING,
    });
  }
  return out;
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

// Phase-agnostic per-card scorer. Callers build the delivery and dining
// specs from their own allocation rules; this collapses the per-stream
// returns into a single ranked card row.
function scoreCardFromStreams(
  card: MockCard,
  deliverySpend: number,
  deliverySpecs: FoodSubSpec[],
  diningSpend: number,
  diningSpecs: FoodSubSpec[],
  index: Map<string, MockBestOf>,
  rules: MockRule[],
): CardFoodReturn {
  const delivery = evaluateStream(
    deliverySpecs,
    deliverySpend,
    card,
    index,
    rules,
  );
  const dining = evaluateStream(diningSpecs, diningSpend, card, index, rules);
  const annualReturnInr = delivery.returnInr + dining.returnInr;
  const annualSpend = deliverySpend + diningSpend;
  return {
    cardId: card._id,
    cardName: card.name,
    delivery,
    dining,
    annualSpend,
    annualReturnInr,
    effectiveRatePercentage:
      annualSpend > 0 ? (annualReturnInr / annualSpend) * 100 : 0,
  };
}

function scoreCard(
  card: MockCard,
  spend: FoodSpendBreakdown,
  index: Map<string, MockBestOf>,
  rules: MockRule[],
): CardFoodReturn {
  return scoreCardFromStreams(
    card,
    spend.annualDeliverySpend,
    buildDeliverySpecs(spend),
    spend.annualDiningSpend,
    buildDiningSpecs(spend),
    index,
    rules,
  );
}

export function recommendFoodCardPhaseOne(
  input: FoodCardPhaseOneInput,
  cards: MockCard[],
  bestOfList: MockBestOf[],
  rules: MockRule[],
): FoodCardEngineResult {
  const spend = buildFoodSpendBreakdown(input);
  const index = buildBestOfIndex(bestOfList);

  const byCard = cards
    .filter((c) => c.is_active)
    .map((card) => scoreCard(card, spend, index, rules))
    .sort((a, b) => b.annualReturnInr - a.annualReturnInr)
    // Surface only the best 3 cards by annual return.
    .slice(0, 3);

  return {
    input,
    spend,
    byCard,
    best: byCard[0] ?? null,
  };
}

// ============================================================================
// Phase 2 — declared per-bill amounts + explicit dining payment route
// ============================================================================
//
// Phase 2 replaces phase 1's flat ₹700 / ₹2000 assumptions with user-supplied
// per-bill amounts and adds a `diningOutPlatformPreference` so the dining pot
// can route to aggregators (Swiggy Dineout, Zomato District, EazyDiner) that
// have their own merchant rules. Delivery preference loses the "both" option;
// "swiggy"/"zomato" now split 80/20 (vs. 75/25 in phase 1).

export type FoodDeliveryPlatformPreferenceTwo = "swiggy" | "zomato" | "others";

export type FoodDiningPlatformPreference =
  | "swiggy_dineout"
  | "zomato_district"
  | "eazydiner"
  | "others";

export interface FoodCardPhaseTwoInput {
  onlineFoodDeliveryFrequency: number;
  diningOutFrequency: number;
  onlineFoodDeliveryAverageSpend: number;
  diningOutAverageSpend: number;
  foodDeliveryPlatformPreference: FoodDeliveryPlatformPreferenceTwo;
  diningOutPlatformPreference: FoodDiningPlatformPreference;
}

interface DeliverySharesTwo {
  swiggy: number;
  zomato: number;
  other: number;
}

interface DiningShares {
  swiggyDineout: number;
  zomatoDistrict: number;
  eazyDiner: number;
  other: number;
}

function deliverySharesTwo(
  pref: FoodDeliveryPlatformPreferenceTwo,
): DeliverySharesTwo {
  switch (pref) {
    case "swiggy":
      return { swiggy: 0.8, zomato: 0, other: 0.2 };
    case "zomato":
      return { swiggy: 0, zomato: 0.8, other: 0.2 };
    case "others":
      return { swiggy: 0, zomato: 0, other: 1 };
  }
}

function diningShares(pref: FoodDiningPlatformPreference): DiningShares {
  switch (pref) {
    case "swiggy_dineout":
      return {
        swiggyDineout: 0.7,
        zomatoDistrict: 0,
        eazyDiner: 0,
        other: 0.3,
      };
    case "zomato_district":
      return {
        swiggyDineout: 0,
        zomatoDistrict: 0.7,
        eazyDiner: 0,
        other: 0.3,
      };
    case "eazydiner":
      return {
        swiggyDineout: 0,
        zomatoDistrict: 0,
        eazyDiner: 0.7,
        other: 0.3,
      };
    case "others":
      return { swiggyDineout: 0, zomatoDistrict: 0, eazyDiner: 0, other: 1 };
  }
}

export interface FoodSpendBreakdownTwo {
  annualDeliverySpend: number;
  annualDiningSpend: number;
  annualTotal: number;
  deliveryAllocation: {
    swiggy: number;
    zomato: number;
    other: number;
  };
  diningAllocation: {
    swiggyDineout: number;
    zomatoDistrict: number;
    eazyDiner: number;
    other: number;
  };
}

export function buildFoodSpendBreakdownTwo(
  input: FoodCardPhaseTwoInput,
): FoodSpendBreakdownTwo {
  const delivery =
    Math.max(0, input.onlineFoodDeliveryFrequency) *
    Math.max(0, input.onlineFoodDeliveryAverageSpend) *
    MONTHS_PER_YEAR;
  const dining =
    Math.max(0, input.diningOutFrequency) *
    Math.max(0, input.diningOutAverageSpend) *
    MONTHS_PER_YEAR;
  const dShares = deliverySharesTwo(input.foodDeliveryPlatformPreference);
  const oShares = diningShares(input.diningOutPlatformPreference);
  return {
    annualDeliverySpend: delivery,
    annualDiningSpend: dining,
    annualTotal: delivery + dining,
    deliveryAllocation: {
      swiggy: delivery * dShares.swiggy,
      zomato: delivery * dShares.zomato,
      other: delivery * dShares.other,
    },
    diningAllocation: {
      swiggyDineout: dining * oShares.swiggyDineout,
      zomatoDistrict: dining * oShares.zomatoDistrict,
      eazyDiner: dining * oShares.eazyDiner,
      other: dining * oShares.other,
    },
  };
}

function buildDeliverySpecsTwo(spend: FoodSpendBreakdownTwo): FoodSubSpec[] {
  const out: FoodSubSpec[] = [];
  const { swiggy, zomato, other } = spend.deliveryAllocation;
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

function buildDiningSpecsTwo(spend: FoodSpendBreakdownTwo): FoodSubSpec[] {
  const out: FoodSubSpec[] = [];
  const { swiggyDineout, zomatoDistrict, eazyDiner, other } =
    spend.diningAllocation;
  if (swiggyDineout > 0) {
    out.push({
      kind: "merchant",
      label: "Swiggy Dineout",
      spend: swiggyDineout,
      category: CATEGORIES.DINING,
      merchant: MERCHANTS.SWIGGY_DINEOUT,
    });
  }
  if (zomatoDistrict > 0) {
    out.push({
      kind: "merchant",
      label: "Zomato District",
      spend: zomatoDistrict,
      category: CATEGORIES.DINING,
      merchant: MERCHANTS.ZOMATO_DISTRICT,
    });
  }
  if (eazyDiner > 0) {
    out.push({
      kind: "merchant",
      label: "EazyDiner",
      spend: eazyDiner,
      category: CATEGORIES.DINING,
      merchant: MERCHANTS.EAZYDINER,
    });
  }
  if (other > 0) {
    out.push({
      kind: "fallback",
      label: "Direct restaurant payment",
      spend: other,
      category: CATEGORIES.DINING,
    });
  }
  return out;
}

export interface FoodCardEngineResultTwo {
  input: FoodCardPhaseTwoInput;
  spend: FoodSpendBreakdownTwo;
  byCard: CardFoodReturn[];
  best: CardFoodReturn | null;
}

export function recommendFoodCardPhaseTwo(
  input: FoodCardPhaseTwoInput,
  cards: MockCard[],
  bestOfList: MockBestOf[],
  rules: MockRule[],
): FoodCardEngineResultTwo {
  const spend = buildFoodSpendBreakdownTwo(input);
  const index = buildBestOfIndex(bestOfList);

  const byCard = cards
    .filter((c) => c.is_active)
    .map((card) =>
      scoreCardFromStreams(
        card,
        spend.annualDeliverySpend,
        buildDeliverySpecsTwo(spend),
        spend.annualDiningSpend,
        buildDiningSpecsTwo(spend),
        index,
        rules,
      ),
    )
    .sort((a, b) => b.annualReturnInr - a.annualReturnInr)
    // Surface only the best 3 cards by annual return.
    .slice(0, 3);

  return { input, spend, byCard, best: byCard[0] ?? null };
}
