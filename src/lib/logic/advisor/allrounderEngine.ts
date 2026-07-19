import { CATEGORIES, type Category, type MockCard } from "./cards";
import { computeBestOfForCard, type MockBestOf } from "./bestOf";
import { MERCHANTS, type Merchant, type MockRule } from "./rules";
import { computeCategoryReturn, type CategoryReturn } from "./engine";
import {
  filterEligibleCards,
  finalizeCardScore,
  type CardScoreBreakdown,
  type EngineScoringOptions,
} from "./scoring";

// ============================================================================
// Phase 1 — calibrated spend distribution
// ============================================================================

export type AllRounderCategory =
  | "travel"
  | "foodAndDining"
  | "onlineShopping"
  | "utilityBills"
  | "fuel"
  | "rentInsuranceFees";

export type AllRounderBucket = AllRounderCategory | "others";

export const ALL_ROUNDER_CATEGORIES: AllRounderCategory[] = [
  "travel",
  "foodAndDining",
  "onlineShopping",
  "utilityBills",
  "fuel",
  "rentInsuranceFees",
];

const ALL_BUCKETS: AllRounderBucket[] = [...ALL_ROUNDER_CATEGORIES, "others"];

const DEFAULT_ONLINE_RATIO: Record<AllRounderBucket, number> = {
  travel: 0.8,
  foodAndDining: 0.7,
  onlineShopping: 1.0,
  utilityBills: 0.9,
  fuel: 0.05,
  rentInsuranceFees: 1.0,
  others: 0.5,
};

export interface AllRounderPhaseOneInput {
  averageTotalMonthlySpend: number;
  averageOnlineMonthlySpend: number;
  mostSpendCategory: AllRounderCategory[];
}

export interface CategoryAllocation {
  total: number;
  online: number;
  offline: number;
}

export type CategoryAllocations = Record<AllRounderBucket, CategoryAllocation>;

export interface AllRounderPhaseOneOutput {
  monthlyTotal: number;
  monthlyOnline: number;
  monthlyOffline: number;
  categories: CategoryAllocations;
}

function emptyBucketMap<T>(value: T): Record<AllRounderBucket, T> {
  return ALL_BUCKETS.reduce<Record<AllRounderBucket, T>>(
    (acc, b) => {
      acc[b] = value;
      return acc;
    },
    {} as Record<AllRounderBucket, T>,
  );
}

function distributeCategoryTotals(
  total: number,
  selected: AllRounderCategory[],
): Record<AllRounderBucket, number> {
  const totals = emptyBucketMap(0);
  const unique = Array.from(new Set(selected)).slice(0, 2);
  if (unique.length === 0) {
    totals.others = total;
    return totals;
  }
  if (unique.length === 1) {
    totals[unique[0]] = total * 0.5;
    totals.others = total * 0.5;
    return totals;
  }
  totals[unique[0]] = total * 0.35;
  totals[unique[1]] = total * 0.35;
  totals.others = total * 0.3;
  return totals;
}

// Shared online/offline allocation. Given per-bucket monthly totals and the
// target online spend `O`, applies DEFAULT_ONLINE_RATIO with a single scaling
// factor so the realized online sum lands at `O` (clamped to [0, total] per
// bucket). Reused by phase 1 and phase 2 — both produce the same output shape
// once they've decided their bucket totals.
function allocateOnlineOffline(
  totals: Record<AllRounderBucket, number>,
  O: number,
): AllRounderPhaseOneOutput {
  const monthlyTotal = ALL_BUCKETS.reduce((acc, b) => acc + totals[b], 0);
  const targetOnline = Math.max(0, Math.min(O, monthlyTotal));

  let impliedOnline = 0;
  for (const b of ALL_BUCKETS) {
    impliedOnline += totals[b] * DEFAULT_ONLINE_RATIO[b];
  }
  const k = impliedOnline > 0 ? targetOnline / impliedOnline : 0;

  const categories = emptyBucketMap<CategoryAllocation>({
    total: 0,
    online: 0,
    offline: 0,
  });
  let onlineSum = 0;
  for (const b of ALL_BUCKETS) {
    const adjusted = Math.min(Math.max(DEFAULT_ONLINE_RATIO[b] * k, 0), 1);
    const total = totals[b];
    const online = total * adjusted;
    const offline = total - online;
    categories[b] = { total, online, offline };
    onlineSum += online;
  }

  return {
    monthlyTotal,
    monthlyOnline: onlineSum,
    monthlyOffline: monthlyTotal - onlineSum,
    categories,
  };
}

export function allRounderPhaseOne(
  input: AllRounderPhaseOneInput,
): AllRounderPhaseOneOutput {
  const T = Math.max(0, input.averageTotalMonthlySpend);
  const totals = distributeCategoryTotals(T, input.mostSpendCategory);
  return allocateOnlineOffline(totals, input.averageOnlineMonthlySpend);
}

// ============================================================================
// Phase 2 — sub-bucket allocation and per-card reward computation
// ============================================================================

// Steady monthly spend: monthly caps refill 12×/year, quarterly 4×, annual 1×.
const ANNUAL_CAP_PERIODS = 12;

type SubAllocationSpec =
  | {
      kind: "best-of";
      label: string;
      share: number;
      category: Category;
    }
  | {
      kind: "merchant";
      label: string;
      share: number;
      category: Category;
      merchant: Merchant;
    }
  | {
      // Expanded at evaluation time into 1-2 `merchant` specs (or fallback if
      // neither merchant has a rule). `topShare` goes to the higher-yielding
      // merchant, `tailShare` to the other; if only one is present, it gets
      // the full share.
      kind: "merchant-pair";
      label: string;
      share: number;
      category: Category;
      merchants: [Merchant, Merchant];
      topShare: number;
      tailShare: number;
    }
  | {
      // Expanded at evaluation time into `shares.length` concrete specs: the
      // i-th highest-yielding merchant gets `shares[i]`. If fewer than N
      // merchants have rules for the category, the unfilled slots fall back to
      // base reward. `share` documents the total contribution (= sum of
      // `shares`) but isn't read by the engine; `shares` are absolute
      // fractions of the parent pot.
      kind: "top-n";
      label: string;
      share: number;
      category: Category;
      shares: number[];
    }
  | {
      // Spec form of "best-of each category, then average". Expanded into N
      // `best-of` specs, each at `share / N`. The bucket return equals
      // `share × mean(best-of rate per category)` — exclusions short-circuit
      // any category with no specific merchant rule to 0%.
      kind: "category-average";
      label: string;
      share: number;
      categories: Category[];
    }
  | {
      kind: "fallback";
      label: string;
      share: number;
    };

type ConcreteSpec = Exclude<
  SubAllocationSpec,
  | { kind: "merchant-pair" }
  | { kind: "top-n" }
  | { kind: "category-average" }
>;

interface BucketRecipe {
  online: SubAllocationSpec[];
  offline: SubAllocationSpec[];
}

// Each recipe slices the bucket's online/offline pot into sub-buckets and tells
// the engine which Category to look up (or to fall back to base reward).
// `share` values must sum to 1 within each side; leave the array empty to skip.
const RECIPES: Record<AllRounderBucket, BucketRecipe> = {
  travel: {
    online: [
      {
        kind: "best-of",
        label: "Flights (40%)",
        share: 0.4,
        category: CATEGORIES.FLIGHTS,
      },
      {
        kind: "best-of",
        label: "Hotels (60%)",
        share: 0.6,
        category: CATEGORIES.HOTELS,
      },
    ],
    offline: [
      { kind: "fallback", label: "Travel offline (fallback)", share: 1.0 },
    ],
  },
  foodAndDining: {
    // Online food: only Swiggy + Zomato count. Higher-yielding gets 70%, the
    // other gets 30%. If only one has a rule it takes 100%; if neither, fallback.
    online: [
      {
        kind: "merchant-pair",
        label: "Food delivery",
        share: 1.0,
        category: CATEGORIES.DINING,
        merchants: [MERCHANTS.SWIGGY, MERCHANTS.ZOMATO],
        topShare: 0.7,
        tailShare: 0.3,
      },
    ],
    offline: [
      {
        kind: "fallback",
        label: "Dining offline",
        share: 1.0,
      },
    ],
  },
  onlineShopping: {
    // Spec: best 40% + 2nd-best 30% + base-reward fallback 30%. The top-n
    // expansion ranks all merchants under the online_shopping category by
    // nominal rate and fills the first two slots; any unfilled slot (when the
    // card has fewer than two online merchants) auto-falls-back.
    online: [
      {
        kind: "top-n",
        label: "Online shopping",
        share: 0.7,
        category: CATEGORIES.ONLINE_SHOPPING,
        shares: [0.4, 0.3],
      },
      { kind: "fallback", label: "Fallback (30%)", share: 0.3 },
    ],
    offline: [],
  },
  utilityBills: {
    online: [
      {
        kind: "best-of",
        label: "Utilities (90% of utility online pot)",
        share: 1.0,
        category: CATEGORIES.UTILITIES,
      },
    ],
    offline: [
      { kind: "fallback", label: "Utility offline (fallback)", share: 1.0 },
    ],
  },
  fuel: {
    online: [{ kind: "fallback", label: "Fuel online (fallback)", share: 1.0 }],
    offline: [
      {
        kind: "best-of",
        label: "Fuel (95%)",
        share: 1.0,
        category: CATEGORIES.FUEL,
      },
    ],
  },
  rentInsuranceFees: {
    // Spec: best(rent) + best(insurance) + best(fees & taxes), averaged.
    // The `category-average` spec encapsulates the operation: it expands into
    // N best-of slots at share/N each, so the bucket return equals
    // `share × mean(best-of rate per category)`. Excluded categories without a
    // specific merchant rule drop to 0% via the exclusion override.
    online: [
      {
        kind: "category-average",
        label: "Rent / Insurance / Fees",
        share: 1.0,
        categories: [
          CATEGORIES.RENT,
          CATEGORIES.INSURANCE,
          CATEGORIES.FEES_TAXES,
        ],
      },
    ],
    offline: [],
  },
  others: {
    online: [{ kind: "fallback", label: "Others online", share: 1.0 }],
    offline: [{ kind: "fallback", label: "Others offline", share: 1.0 }],
  },
};

export interface SubBucketReturn {
  label: string;
  share: number;
  spend: number;
  effectivePercentage: number;
  effectiveRateAfterCap: number;
  source: "voucher" | "direct" | "fallback";
  merchant: string | null;
  category: Category | null;
  returnInr: number;
}

export interface BucketReturn {
  bucket: AllRounderBucket;
  annualSpend: number;
  online: { pot: number; subs: SubBucketReturn[]; returnInr: number };
  offline: { pot: number; subs: SubBucketReturn[]; returnInr: number };
  totalReturnInr: number;
}

export interface CardAllRounderReturn extends CardScoreBreakdown {
  cardId: string;
  cardName: string;
  buckets: Record<AllRounderBucket, BucketReturn>;
  annualSpend: number;
  annualReturnInr: number;
  effectiveRatePercentage: number;
}

export interface AllRounderEngineResult {
  input: AllRounderPhaseOneInput;
  phaseOne: AllRounderPhaseOneOutput;
  annualTotal: number;
  annualOnline: number;
  annualOffline: number;
  byCard: CardAllRounderReturn[];
  best: CardAllRounderReturn | null;
}

function buildIndex(bestOf: MockBestOf[]): Map<string, MockBestOf> {
  const map = new Map<string, MockBestOf>();
  for (const entry of bestOf) {
    map.set(`${entry.cardId}::${entry.category}`, entry);
  }
  return map;
}

// Build a MockBestOf scoped to a single merchant by reusing the existing
// best-of pipeline on the merchant's rule subset. Returns undefined when the
// card has no rule for that merchant — caller should fall back.
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

// Higher = better. Compares the nominal rates the merchant's rule advertises
// (caps don't bind at low spend); fine as a tie-break for which merchant
// deserves the larger share.
function merchantNominalRate(
  bestOf: MockBestOf | undefined,
  baseRate: number,
): number {
  if (!bestOf) return baseRate;
  const direct = bestOf.bestDirectSwipe?.percentage ?? 0;
  const voucher = bestOf.bestVoucher?.totalPercentage ?? 0;
  return Math.max(direct, voucher, baseRate);
}

const CATEGORY_DISPLAY_LABELS: Partial<Record<Category, string>> = {
  [CATEGORIES.FLIGHTS]: "Flights",
  [CATEGORIES.HOTELS]: "Hotels",
  [CATEGORIES.FOREX]: "Forex",
  [CATEGORIES.DINING]: "Dining",
  [CATEGORIES.FUEL]: "Fuel",
  [CATEGORIES.GROCERY]: "Grocery",
  [CATEGORIES.ONLINE_SHOPPING]: "Online Shopping",
  [CATEGORIES.UTILITIES]: "Utilities",
  [CATEGORIES.OTHER]: "Other",
  [CATEGORIES.RENT]: "Rent",
  [CATEGORIES.INSURANCE]: "Insurance",
  [CATEGORIES.FEES_TAXES]: "Fees & Taxes",
};

function humanizeCategory(cat: Category): string {
  return CATEGORY_DISPLAY_LABELS[cat] ?? cat.replace(/_/g, " ");
}

// Rank merchants for a (card, category) by nominal effective rate, descending.
// Only merchants whose rate beats the card's base reward are returned — sub
// par merchants get fallback treatment via the unfilled slots.
function topMerchantsForCategory(
  card: MockCard,
  category: Category,
  n: number,
  rules: MockRule[],
): { merchant: Merchant; rate: number }[] {
  const merchants = new Set<Merchant>();
  for (const r of rules) {
    if (r.cardId !== card._id) continue;
    if (r.category !== category) continue;
    if (!r.is_active) continue;
    if (!r.merchant) continue;
    merchants.add(r.merchant);
  }
  const baseRate = card.rewards.base_reward_rate;
  const ranked: { merchant: Merchant; rate: number }[] = [];
  for (const m of merchants) {
    const best = merchantBestOf(card, category, m, rules);
    const rate = merchantNominalRate(best, baseRate);
    if (rate <= baseRate) continue;
    ranked.push({ merchant: m, rate });
  }
  ranked.sort((a, b) => b.rate - a.rate);
  return ranked.slice(0, n);
}

function expandSpec(
  spec: SubAllocationSpec,
  card: MockCard,
  rules: MockRule[],
): ConcreteSpec[] {
  if (spec.kind === "top-n") {
    const top = topMerchantsForCategory(
      card,
      spec.category,
      spec.shares.length,
      rules,
    );
    return spec.shares.map((sh, i) => {
      const pct = Math.round(sh * 100);
      const rankLabel =
        i === 0 ? "best" : i === 1 ? "2nd best" : `rank ${i + 1}`;
      if (i < top.length) {
        return {
          kind: "merchant",
          label: `${spec.label} · ${top[i].merchant} (${rankLabel} ${pct}%)`,
          share: sh,
          category: spec.category,
          merchant: top[i].merchant,
        };
      }
      return {
        kind: "fallback",
        label: `${spec.label} · ${rankLabel} (no rule, ${pct}%)`,
        share: sh,
      };
    });
  }
  if (spec.kind === "category-average") {
    const n = spec.categories.length;
    if (n === 0) {
      return [
        {
          kind: "fallback",
          label: `${spec.label} (no categories)`,
          share: spec.share,
        },
      ];
    }
    const perShare = spec.share / n;
    return spec.categories.map((cat) => ({
      kind: "best-of",
      label: humanizeCategory(cat),
      share: perShare,
      category: cat,
    }));
  }
  if (spec.kind !== "merchant-pair") return [spec];
  const [mA, mB] = spec.merchants;
  const boA = merchantBestOf(card, spec.category, mA, rules);
  const boB = merchantBestOf(card, spec.category, mB, rules);
  if (!boA && !boB) {
    return [
      {
        kind: "fallback",
        label: `${spec.label} (no ${mA}/${mB} rule — fallback)`,
        share: spec.share,
      },
    ];
  }
  if (!boB) {
    return [
      {
        kind: "merchant",
        label: `${spec.label} · ${mA} (100%)`,
        share: spec.share,
        category: spec.category,
        merchant: mA,
      },
    ];
  }
  if (!boA) {
    return [
      {
        kind: "merchant",
        label: `${spec.label} · ${mB} (100%)`,
        share: spec.share,
        category: spec.category,
        merchant: mB,
      },
    ];
  }
  const rateA = merchantNominalRate(boA, card.rewards.base_reward_rate);
  const rateB = merchantNominalRate(boB, card.rewards.base_reward_rate);
  const [top, tail] = rateA >= rateB ? [mA, mB] : [mB, mA];
  const topPct = Math.round(spec.topShare * 100);
  const tailPct = Math.round(spec.tailShare * 100);
  return [
    {
      kind: "merchant",
      label: `${spec.label} · ${top} (best ${topPct}%)`,
      share: spec.share * spec.topShare,
      category: spec.category,
      merchant: top,
    },
    {
      kind: "merchant",
      label: `${spec.label} · ${tail} (${tailPct}%)`,
      share: spec.share * spec.tailShare,
      category: spec.category,
      merchant: tail,
    },
  ];
}

// Maps each all-rounder bucket to the underlying Category whose exclusion list
// governs the fallback rate. Buckets with no clean category match (travel mix,
// rent/insurance/fees, others) map to OTHER, which no card excludes today.
const BUCKET_FALLBACK_CATEGORY: Record<AllRounderBucket, Category> = {
  travel: CATEGORIES.OTHER,
  foodAndDining: CATEGORIES.DINING,
  onlineShopping: CATEGORIES.ONLINE_SHOPPING,
  utilityBills: CATEGORIES.UTILITIES,
  fuel: CATEGORIES.FUEL,
  rentInsuranceFees: CATEGORIES.OTHER,
  others: CATEGORIES.OTHER,
};

function effectiveFallbackRate(
  card: MockCard,
  bucket: AllRounderBucket,
): number {
  const cat = BUCKET_FALLBACK_CATEGORY[bucket];
  if (card.excluded_categories?.includes(cat)) return 0;
  return card.rewards.base_reward_rate;
}

function evaluateSpec(
  spec: ConcreteSpec,
  parentPot: number,
  card: MockCard,
  index: Map<string, MockBestOf>,
  rules: MockRule[],
  fallbackRate: number,
): SubBucketReturn {
  const spend = parentPot * spec.share;

  // Fallback specs short-circuit through `fallbackRate` (which already honors
  // the card's category exclusions). No cap handling — these represent spend
  // that doesn't match any merchant rule.
  if (spec.kind === "fallback") {
    return {
      label: spec.label,
      share: spec.share,
      spend,
      effectivePercentage: fallbackRate,
      effectiveRateAfterCap: fallbackRate,
      source: "fallback",
      merchant: null,
      category: null,
      returnInr: (spend * fallbackRate) / 100,
    };
  }

  let category: Category;
  let bestOf: MockBestOf | undefined;

  if (spec.kind === "best-of") {
    category = spec.category;
    bestOf = index.get(`${card._id}::${spec.category}`);
  } else {
    // kind === "merchant"
    category = spec.category;
    bestOf = merchantBestOf(card, spec.category, spec.merchant, rules);
  }

  const cat: CategoryReturn = computeCategoryReturn(
    spend,
    category,
    card,
    bestOf,
    ANNUAL_CAP_PERIODS,
  );

  // When the best-of / merchant lookup falls through to base rate AND the
  // card excludes this category, force 0%. Specific merchant rules (source
  // = direct or voucher) keep earning — exclusion only kills the fallback.
  const excluded =
    cat.source === "fallback" &&
    card.excluded_categories?.includes(spec.category) === true;

  return {
    label: spec.label,
    share: spec.share,
    spend,
    effectivePercentage: excluded ? 0 : cat.effectivePercentage,
    effectiveRateAfterCap: excluded ? 0 : cat.effectiveRateAfterCap,
    source: cat.source,
    merchant: cat.merchant,
    category: spec.category,
    returnInr: excluded ? 0 : cat.returnInr,
  };
}

function evaluateBucket(
  bucket: AllRounderBucket,
  alloc: CategoryAllocation,
  card: MockCard,
  index: Map<string, MockBestOf>,
  rules: MockRule[],
): BucketReturn {
  const recipe = RECIPES[bucket];
  const onlinePot = alloc.online * 12;
  const offlinePot = alloc.offline * 12;
  const fallbackRate = effectiveFallbackRate(card, bucket);

  const onlineSubs = recipe.online
    .flatMap((s) => expandSpec(s, card, rules))
    .map((s) => evaluateSpec(s, onlinePot, card, index, rules, fallbackRate));
  const offlineSubs = recipe.offline
    .flatMap((s) => expandSpec(s, card, rules))
    .map((s) => evaluateSpec(s, offlinePot, card, index, rules, fallbackRate));

  const onlineReturn = onlineSubs.reduce((acc, s) => acc + s.returnInr, 0);
  const offlineReturn = offlineSubs.reduce((acc, s) => acc + s.returnInr, 0);

  return {
    bucket,
    annualSpend: alloc.total * 12,
    online: { pot: onlinePot, subs: onlineSubs, returnInr: onlineReturn },
    offline: { pot: offlinePot, subs: offlineSubs, returnInr: offlineReturn },
    totalReturnInr: onlineReturn + offlineReturn,
  };
}

interface DistributionScoring {
  byCard: CardAllRounderReturn[];
  best: CardAllRounderReturn | null;
  annualTotal: number;
  annualOnline: number;
  annualOffline: number;
}

// Phase-agnostic card evaluation. Given a finalized monthly distribution
// (totals + online/offline split per bucket), scores every active card by
// summing per-bucket returns. Phase 1 and phase 2 differ only in how they
// produce the distribution.
function scoreCardsForDistribution(
  distribution: AllRounderPhaseOneOutput,
  cards: MockCard[],
  bestOfList: MockBestOf[],
  rules: MockRule[],
  options?: EngineScoringOptions,
): DistributionScoring {
  const index = buildIndex(bestOfList);
  const annualTotal = distribution.monthlyTotal * 12;

  const byCard = filterEligibleCards(cards, options?.profile)
    .map<CardAllRounderReturn>((card) => {
      const buckets = emptyBucketMap<BucketReturn>(
        // placeholder; immediately overwritten below
        {
          bucket: "others",
          annualSpend: 0,
          online: { pot: 0, subs: [], returnInr: 0 },
          offline: { pot: 0, subs: [], returnInr: 0 },
          totalReturnInr: 0,
        },
      );
      let annualReturnInr = 0;
      for (const b of ALL_BUCKETS) {
        const br = evaluateBucket(
          b,
          distribution.categories[b],
          card,
          index,
          rules,
        );
        buckets[b] = br;
        annualReturnInr += br.totalReturnInr;
      }
      return {
        cardId: card._id,
        cardName: card.name,
        buckets,
        annualSpend: annualTotal,
        annualReturnInr,
        effectiveRatePercentage:
          annualTotal > 0 ? (annualReturnInr / annualTotal) * 100 : 0,
        ...finalizeCardScore(
          card,
          annualReturnInr,
          annualTotal,
          options?.milestonesBySlug?.get(card._id),
        ),
      };
    })
    .sort((a, b) => b.finalReturnInr - a.finalReturnInr)
    // Surface only the best 3 cards by final return (both phases).
    .slice(0, 3);

  return {
    byCard,
    best: byCard[0] ?? null,
    annualTotal,
    annualOnline: distribution.monthlyOnline * 12,
    annualOffline: distribution.monthlyOffline * 12,
  };
}

export function recommendAllRounderCardPhaseOne(
  input: AllRounderPhaseOneInput,
  cards: MockCard[],
  bestOfList: MockBestOf[],
  rules: MockRule[],
  options?: EngineScoringOptions,
): AllRounderEngineResult {
  const phaseOne = allRounderPhaseOne(input);
  const scoring = scoreCardsForDistribution(
    phaseOne,
    cards,
    bestOfList,
    rules,
    options,
  );
  return { input, phaseOne, ...scoring };
}

// ============================================================================
// Phase 2 — declared per-category spend
// ============================================================================

export interface AllRounderPhaseTwoInput {
  averageTotalMonthlySpend: number;
  averageOnlineMonthlySpend: number;
  annualTravelSpend: number;
  monthlyDining: number;
  monthlyBills: number;
  monthlyOnlineShopping: number;
  monthlyFuel: number;
  monthlyRentInsuranceFees: number;
}

export interface AllRounderPhaseTwoOutput extends AllRounderPhaseOneOutput {
  // Pre-scaling declared monthly spend per category (travel already in monthly
  // form). Useful for the UI to surface what the user typed vs. what the model
  // settled on after scaling — but the scaling itself is an internal correction
  // and shouldn't be exposed as a separate line item.
  declared: Record<AllRounderCategory, number>;
  declaredTotal: number;
  scalingFactor: number;
}

export interface AllRounderEnginePhaseTwoResult {
  input: AllRounderPhaseTwoInput;
  phaseTwo: AllRounderPhaseTwoOutput;
  annualTotal: number;
  annualOnline: number;
  annualOffline: number;
  byCard: CardAllRounderReturn[];
  best: CardAllRounderReturn | null;
}

function declaredFromPhaseTwoInput(
  input: AllRounderPhaseTwoInput,
): Record<AllRounderCategory, number> {
  return {
    travel: Math.max(0, input.annualTravelSpend) / 12,
    foodAndDining: Math.max(0, input.monthlyDining),
    onlineShopping: Math.max(0, input.monthlyOnlineShopping),
    utilityBills: Math.max(0, input.monthlyBills),
    fuel: Math.max(0, input.monthlyFuel),
    rentInsuranceFees: Math.max(0, input.monthlyRentInsuranceFees),
  };
}

// Phase 2 distribution: convert declared per-category spend into bucket totals
// that sum to T. Two paths:
//   - declared ≤ T: keep declared as-is, dump the residual into `others`.
//   - declared > T: scale every declared category by T/declared (no others).
// Edge case: declared sum is 0 — treat everything as `others`.
function distributeFromDeclared(
  input: AllRounderPhaseTwoInput,
): {
  totals: Record<AllRounderBucket, number>;
  declared: Record<AllRounderCategory, number>;
  declaredTotal: number;
  scalingFactor: number;
} {
  const T = Math.max(0, input.averageTotalMonthlySpend);
  const declared = declaredFromPhaseTwoInput(input);
  const declaredTotal = ALL_ROUNDER_CATEGORIES.reduce(
    (acc, c) => acc + declared[c],
    0,
  );

  const totals = emptyBucketMap(0);

  if (declaredTotal === 0) {
    totals.others = T;
    return { totals, declared, declaredTotal, scalingFactor: 1 };
  }

  if (declaredTotal <= T) {
    for (const c of ALL_ROUNDER_CATEGORIES) totals[c] = declared[c];
    totals.others = T - declaredTotal;
    return { totals, declared, declaredTotal, scalingFactor: 1 };
  }

  const scalingFactor = T / declaredTotal;
  for (const c of ALL_ROUNDER_CATEGORIES) {
    totals[c] = declared[c] * scalingFactor;
  }
  return { totals, declared, declaredTotal, scalingFactor };
}

export function allRounderPhaseTwo(
  input: AllRounderPhaseTwoInput,
): AllRounderPhaseTwoOutput {
  const { totals, declared, declaredTotal, scalingFactor } =
    distributeFromDeclared(input);
  const allocation = allocateOnlineOffline(
    totals,
    input.averageOnlineMonthlySpend,
  );
  return { ...allocation, declared, declaredTotal, scalingFactor };
}

export function recommendAllRounderCardPhaseTwo(
  input: AllRounderPhaseTwoInput,
  cards: MockCard[],
  bestOfList: MockBestOf[],
  rules: MockRule[],
  options?: EngineScoringOptions,
): AllRounderEnginePhaseTwoResult {
  const phaseTwo = allRounderPhaseTwo(input);
  const scoring = scoreCardsForDistribution(
    phaseTwo,
    cards,
    bestOfList,
    rules,
    options,
  );
  return { input, phaseTwo, ...scoring };
}
