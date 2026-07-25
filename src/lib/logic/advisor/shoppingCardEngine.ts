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
// Phase 1 — channel & platform-based shopping card recommendation
// ============================================================================
//
// Inputs: monthly shopping spend (₹), channel preference (online/equal/
// offline) and one or more preferred online platforms. The engine converts the
// monthly figure to an annual pot, splits it across online/offline channels by
// preference, then slices the online pot per merchant (with leftover going to
// a generic "others" fallback). Offline spend lands in OFFLINE_SHOPPING and
// picks up the card's best offline-shopping rule (or its base rate when no
// specific rule applies).

const MONTHS_PER_YEAR = 12;
// Steady monthly spend: monthly caps refill 12×/year, quarterly 4×, annually 1.
const ANNUAL_CAP_PERIODS = 12;

export type ShoppingPreference = "online" | "equal" | "offline";

export type ShoppingOnlinePlatform =
  | "amazon"
  | "flipkart"
  | "myntra"
  | "ajio"
  | "nykaa"
  | "tata_neu_cliq"
  | "multiple_platform";

export interface ShoppingCardPhaseOneInput {
  monthlySpend: number;
  shoppingPreference: ShoppingPreference;
  preferredOnlinePlatform: ShoppingOnlinePlatform[];
}

// Map UI platform → engine merchant identifier. Tata Neu/CliQ collapses onto
// TATA_CLIQ since cards carry rules under the CliQ merchant only.
const PLATFORM_TO_MERCHANT: Record<
  Exclude<ShoppingOnlinePlatform, "multiple_platform">,
  Merchant
> = {
  amazon: MERCHANTS.AMAZON,
  flipkart: MERCHANTS.FLIPKART,
  myntra: MERCHANTS.MYNTRA,
  ajio: MERCHANTS.AJIO,
  nykaa: MERCHANTS.NYKAA,
  tata_neu_cliq: MERCHANTS.TATA_CLIQ,
};

const PLATFORM_LABEL: Record<
  Exclude<ShoppingOnlinePlatform, "multiple_platform">,
  string
> = {
  amazon: "Amazon",
  flipkart: "Flipkart",
  myntra: "Myntra",
  ajio: "Ajio",
  nykaa: "Nykaa",
  tata_neu_cliq: "Tata Neu / Tata CliQ",
};

interface ChannelShares {
  online: number;
  offline: number;
}

function channelShares(pref: ShoppingPreference): ChannelShares {
  switch (pref) {
    case "online":
      return { online: 0.8, offline: 0.2 };
    case "equal":
      return { online: 0.5, offline: 0.5 };
    case "offline":
      return { online: 0.25, offline: 0.75 };
  }
}

export interface OnlinePlatformAllocation {
  // null merchant → generic "others" bucket (earns the card's fallback rate).
  merchant: Merchant | null;
  label: string;
  spend: number;
}

export interface ShoppingSpendBreakdown {
  annualTotal: number;
  annualOnline: number;
  annualOffline: number;
  onlineAllocation: OnlinePlatformAllocation[];
  offlineAllocation: { label: string; spend: number };
}

// Multi-platform online split: 80% goes to the preferred platforms (divided
// equally), 20% to the "others" bucket. The single-platform case is its own
// rule (70/30, see below).
const ONLINE_PREFERRED_SHARE = 0.8;
const ONLINE_OTHERS_SHARE = 0.2;

function buildOnlineAllocation(
  onlineSpend: number,
  preferred: ShoppingOnlinePlatform[],
): OnlinePlatformAllocation[] {
  const seen = new Set<ShoppingOnlinePlatform>();
  const specific: Exclude<ShoppingOnlinePlatform, "multiple_platform">[] = [];
  let multiple = false;
  for (const p of preferred) {
    if (seen.has(p)) continue;
    seen.add(p);
    if (p === "multiple_platform") {
      multiple = true;
    } else {
      specific.push(p);
    }
  }

  // No specific platforms → 100% to "others" (covers both empty input and the
  // explicit "I shop across many platforms" choice).
  if (specific.length === 0) {
    return [
      { merchant: null, label: "Other online platforms", spend: onlineSpend },
    ];
  }

  // Single specific platform → 70% to platform, 30% to others.
  if (specific.length === 1 && !multiple) {
    const p = specific[0];
    return [
      {
        merchant: PLATFORM_TO_MERCHANT[p],
        label: PLATFORM_LABEL[p],
        spend: onlineSpend * 0.7,
      },
      {
        merchant: null,
        label: "Other online platforms",
        spend: onlineSpend * 0.3,
      },
    ];
  }

  // Multiple specific platforms (N ≥ 2) → 80% split equally across the N
  // preferred platforms, 20% to "others". The single-platform case above keeps
  // its 70/30 split. If the user also picked "I shop across many", it's
  // already represented by the "others" bucket — no extra share added.
  const perPlatform = ONLINE_PREFERRED_SHARE / specific.length;
  const out: OnlinePlatformAllocation[] = specific.map((p) => ({
    merchant: PLATFORM_TO_MERCHANT[p],
    label: PLATFORM_LABEL[p],
    spend: onlineSpend * perPlatform,
  }));
  out.push({
    merchant: null,
    label: "Other online platforms",
    spend: onlineSpend * ONLINE_OTHERS_SHARE,
  });
  return out;
}

export function buildShoppingSpendBreakdown(
  input: ShoppingCardPhaseOneInput,
): ShoppingSpendBreakdown {
  const annualTotal = Math.max(0, input.monthlySpend) * MONTHS_PER_YEAR;
  const { online, offline } = channelShares(input.shoppingPreference);
  const annualOnline = annualTotal * online;
  const annualOffline = annualTotal * offline;
  return {
    annualTotal,
    annualOnline,
    annualOffline,
    onlineAllocation: buildOnlineAllocation(
      annualOnline,
      input.preferredOnlinePlatform,
    ),
    offlineAllocation: { label: "Offline shopping", spend: annualOffline },
  };
}

// ============================================================================
// Per-card scoring
// ============================================================================

type ShoppingSubSpec =
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

export interface ShoppingSubReturn {
  label: string;
  spend: number;
  effectivePercentage: number;
  effectiveRateAfterCap: number;
  source: "voucher" | "direct" | "fallback";
  merchant: string | null;
  returnInr: number;
}

export interface ShoppingStreamReturn {
  spend: number;
  subs: ShoppingSubReturn[];
  returnInr: number;
}

export interface CardShoppingReturn extends CardScoreBreakdown {
  cardId: string;
  cardName: string;
  online: ShoppingStreamReturn;
  offline: ShoppingStreamReturn;
  annualSpend: number;
  annualReturnInr: number;
  effectiveRatePercentage: number;
}

export interface ShoppingCardEngineResult {
  input: ShoppingCardPhaseOneInput;
  spend: ShoppingSpendBreakdown;
  byCard: CardShoppingReturn[];
  best: CardShoppingReturn | null;
}

function buildBestOfIndex(bestOfList: MockBestOf[]): Map<string, MockBestOf> {
  const index = new Map<string, MockBestOf>();
  for (const entry of bestOfList) {
    index.set(`${entry.cardId}::${entry.category}`, entry);
  }
  return index;
}

// Merchant-scoped best-of: reruns best-of against the merchant's rules PLUS the
// category-wide (merchant === null) rules. The merchant rules feed the direct
// frontier; the best category rule becomes the baseTier, so spend not covered by
// a merchant accelerator falls back to the category rate before the card base
// rate. Returns undefined only when the card has neither — caller then drops to
// the card's base rate.
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
      (r.merchant === merchant || r.merchant === null) &&
      r.is_active,
  );
  if (subset.length === 0) return undefined;
  return computeBestOfForCard(card, subset)[0];
}

function fallbackRate(card: MockCard, category: Category): number {
  if (card.excluded_categories?.includes(category)) return 0;
  return card.rewards.base_reward_rate;
}

// Phase 1 and phase 2 share allocation shape, so these helpers consume only the
// minimal slices they need — letting both phases feed them directly.
function buildOnlineSpecs(
  alloc: OnlinePlatformAllocation[],
): ShoppingSubSpec[] {
  return alloc
    .filter((a) => a.spend > 0)
    .map<ShoppingSubSpec>((a) =>
      a.merchant
        ? {
            kind: "merchant",
            label: a.label,
            spend: a.spend,
            category: CATEGORIES.ONLINE_SHOPPING,
            merchant: a.merchant,
          }
        : {
            // "others" bucket: no specific merchant, but still routes through
            // best-of so a category-wide (merchant === null) rule applies before
            // the card base rate. Falls to base rate when no category rule.
            kind: "category-best",
            label: a.label,
            spend: a.spend,
            category: CATEGORIES.ONLINE_SHOPPING,
          },
    );
}

// Offline split: top accelerated category 20%, 2nd best 10%, OFFLINE_SHOPPING
// base bucket 70%. Candidates for "top" / "2nd best" are DINING, GROCERY, FUEL.
// Ranking is by the card's nominal best-of rate (max of direct / voucher /
// base); categories that don't beat the card's base rate aren't eligible and
// their share folds into the OFFLINE_SHOPPING base bucket.
const OFFLINE_CATEGORY_CANDIDATES = [
  CATEGORIES.OFFLINE_FOOD_DINING,
  CATEGORIES.GROCERY,
  CATEGORIES.FUEL,
] as const;
const OFFLINE_TOP_SHARES = [0.2, 0.1] as const;
const OFFLINE_BASE_SHARE = 0.7;

const OFFLINE_CATEGORY_LABELS: Record<
  (typeof OFFLINE_CATEGORY_CANDIDATES)[number],
  string
> = {
  [CATEGORIES.OFFLINE_FOOD_DINING]: "Dining",
  [CATEGORIES.GROCERY]: "Grocery",
  [CATEGORIES.FUEL]: "Fuel",
};

function categoryNominalRate(
  card: MockCard,
  bestOf: MockBestOf | undefined,
): number {
  const baseRate = card.rewards.base_reward_rate;
  const direct = bestOf?.bestDirectSwipe?.percentage ?? 0;
  const voucher = bestOf?.bestVoucher?.totalPercentage ?? 0;
  return Math.max(direct, voucher, baseRate);
}

function rankOfflineCategories(
  card: MockCard,
  index: Map<string, MockBestOf>,
): Category[] {
  const baseRate = card.rewards.base_reward_rate;
  return OFFLINE_CATEGORY_CANDIDATES.map((cat) => ({
    category: cat,
    rate: categoryNominalRate(card, index.get(`${card._id}::${cat}`)),
  }))
    .filter((c) => c.rate > baseRate)
    .sort((a, b) => b.rate - a.rate)
    .slice(0, OFFLINE_TOP_SHARES.length)
    .map((c) => c.category);
}

function buildOfflineSpecs(
  alloc: { label: string; spend: number },
  card: MockCard,
  index: Map<string, MockBestOf>,
): ShoppingSubSpec[] {
  if (alloc.spend <= 0) return [];

  const ranked = rankOfflineCategories(card, index);
  const specs: ShoppingSubSpec[] = [];
  let baseShare = OFFLINE_BASE_SHARE;

  ranked.forEach((cat, i) => {
    const rankLabel = i === 0 ? "top" : "2nd best";
    specs.push({
      kind: "category-best",
      label: `${
        OFFLINE_CATEGORY_LABELS[
          cat as (typeof OFFLINE_CATEGORY_CANDIDATES)[number]
        ]
      } (${rankLabel} offline)`,
      spend: alloc.spend * OFFLINE_TOP_SHARES[i],
      category: cat,
    });
  });

  // Unfilled top slots collapse into the OFFLINE_SHOPPING base bucket.
  for (let i = ranked.length; i < OFFLINE_TOP_SHARES.length; i++) {
    baseShare += OFFLINE_TOP_SHARES[i];
  }

  specs.push({
    kind: "category-best",
    label: alloc.label,
    spend: alloc.spend * baseShare,
    category: CATEGORIES.OFFLINE_SHOPPING,
  });

  return specs;
}

function evaluateSpec(
  spec: ShoppingSubSpec,
  card: MockCard,
  index: Map<string, MockBestOf>,
  rules: MockRule[],
): ShoppingSubReturn {
  if (spec.kind === "fallback") {
    const rate = fallbackRate(card, spec.category);
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

  // Same exclusion override as the food / all-rounder engines: when best-of
  // falls through to the base rate AND the card excludes the category, force
  // 0%. Specific merchant rules (direct/voucher) keep their declared rate.
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
  specs: ShoppingSubSpec[],
  totalSpend: number,
  card: MockCard,
  index: Map<string, MockBestOf>,
  rules: MockRule[],
): ShoppingStreamReturn {
  const subs = specs.map((s) => evaluateSpec(s, card, index, rules));
  return {
    spend: totalSpend,
    subs,
    returnInr: subs.reduce((acc, s) => acc + s.returnInr, 0),
  };
}

function scoreCard(
  card: MockCard,
  spend: ShoppingSpendBreakdown,
  index: Map<string, MockBestOf>,
  rules: MockRule[],
  options?: EngineScoringOptions,
): CardShoppingReturn {
  const online = evaluateStream(
    buildOnlineSpecs(spend.onlineAllocation),
    spend.annualOnline,
    card,
    index,
    rules,
  );
  const offline = evaluateStream(
    buildOfflineSpecs(spend.offlineAllocation, card, index),
    spend.annualOffline,
    card,
    index,
    rules,
  );
  const annualReturnInr = online.returnInr + offline.returnInr;
  const annualSpend = spend.annualOnline + spend.annualOffline;
  return {
    cardId: card._id,
    cardName: card.name,
    online,
    offline,
    annualSpend,
    annualReturnInr,
    effectiveRatePercentage:
      annualSpend > 0 ? (annualReturnInr / annualSpend) * 100 : 0,
    ...finalizeCardScore(
      card,
      annualReturnInr,
      annualSpend,
      options?.milestonesBySlug?.get(card._id),
    ),
  };
}

export function recommendShoppingCardPhaseOne(
  input: ShoppingCardPhaseOneInput,
  cards: MockCard[],
  bestOfList: MockBestOf[],
  rules: MockRule[],
  options?: EngineScoringOptions,
): ShoppingCardEngineResult {
  const spend = buildShoppingSpendBreakdown(input);
  const index = buildBestOfIndex(bestOfList);

  const byCard = filterEligibleCards(cards, options?.profile)
    .map((card) => scoreCard(card, spend, index, rules, options))
    .sort((a, b) => b.finalReturnInr - a.finalReturnInr);
  // Surface only the best 3 cards by final return.
  // .slice(0, 3);

  return {
    input,
    spend,
    byCard,
    best: byCard[0] ?? null,
  };
}

// ============================================================================
// Phase 2 — declared online spend + optional utility bills
// ============================================================================
//
// Phase 2 replaces phase 1's preset channel splits with a derived ratio
// (online = totalOnlineShoppingMonthlySpend / monthlySpend) and adds an
// independent utility-bills pot when the user reports paying them on cards.
// Platform allocation reuses phase 1's rule (70/30 for one merchant, even
// n+1 split for multiple, 100% "others" when only "multiple_platform" is
// chosen). Utility pot splits 90/10 online/offline; the online side maps to
// the UTILITIES best-of rule, the offline side to the card's fallback rate.

// Matches the all-rounder utility recipe (DEFAULT_ONLINE_RATIO.utilityBills).
const UTILITY_ONLINE_RATIO = 0.9;

export interface ShoppingCardPhaseTwoInput {
  monthlySpend: number;
  preferredOnlinePlatform: ShoppingOnlinePlatform[];
  totalOnlineShoppingMonthlySpend: number;
  additionalUtilityBills: boolean;
  additionalUtilityBillsMonthlySpend: number;
}

export interface UtilityPotBreakdown {
  annualTotal: number;
  annualOnline: number;
  annualOffline: number;
}

export interface ShoppingSpendBreakdownTwo {
  annualTotal: number;
  annualOnline: number;
  annualOffline: number;
  onlineSharePercentage: number;
  offlineSharePercentage: number;
  onlineAllocation: OnlinePlatformAllocation[];
  offlineAllocation: { label: string; spend: number };
  utility: UtilityPotBreakdown | null;
}

function channelSharesFromInput(
  monthlySpend: number,
  onlineMonthlySpend: number,
): ChannelShares {
  const total = Math.max(0, monthlySpend);
  if (total === 0) return { online: 0, offline: 0 };
  const online = Math.max(0, Math.min(onlineMonthlySpend, total)) / total;
  return { online, offline: 1 - online };
}

export function buildShoppingSpendBreakdownTwo(
  input: ShoppingCardPhaseTwoInput,
): ShoppingSpendBreakdownTwo {
  const annualTotal = Math.max(0, input.monthlySpend) * MONTHS_PER_YEAR;
  const { online, offline } = channelSharesFromInput(
    input.monthlySpend,
    input.totalOnlineShoppingMonthlySpend,
  );
  const annualOnline = annualTotal * online;
  const annualOffline = annualTotal * offline;

  const utilityAnnualTotal = input.additionalUtilityBills
    ? Math.max(0, input.additionalUtilityBillsMonthlySpend) * MONTHS_PER_YEAR
    : 0;
  const utility =
    utilityAnnualTotal > 0
      ? {
          annualTotal: utilityAnnualTotal,
          annualOnline: utilityAnnualTotal * UTILITY_ONLINE_RATIO,
          annualOffline: utilityAnnualTotal * (1 - UTILITY_ONLINE_RATIO),
        }
      : null;

  return {
    annualTotal,
    annualOnline,
    annualOffline,
    onlineSharePercentage: online * 100,
    offlineSharePercentage: offline * 100,
    onlineAllocation: buildOnlineAllocation(
      annualOnline,
      input.preferredOnlinePlatform,
    ),
    offlineAllocation: { label: "Offline shopping", spend: annualOffline },
    utility,
  };
}

// Recipe from the spec: online side asks best-of UTILITIES (or fallback when
// the card has no rule); offline side runs straight at the card's fallback
// rate for utilities.
function buildUtilitySpecs(utility: UtilityPotBreakdown): ShoppingSubSpec[] {
  const out: ShoppingSubSpec[] = [];
  if (utility.annualOnline > 0) {
    out.push({
      kind: "category-best",
      label: "Utilities online (best-of)",
      spend: utility.annualOnline,
      category: CATEGORIES.UTILITIES,
    });
  }
  if (utility.annualOffline > 0) {
    out.push({
      kind: "fallback",
      label: "Utility offline (fallback)",
      spend: utility.annualOffline,
      category: CATEGORIES.UTILITIES,
    });
  }
  return out;
}

export interface CardShoppingReturnTwo extends CardShoppingReturn {
  utility: ShoppingStreamReturn | null;
}

export interface ShoppingCardEngineResultTwo {
  input: ShoppingCardPhaseTwoInput;
  spend: ShoppingSpendBreakdownTwo;
  byCard: CardShoppingReturnTwo[];
  best: CardShoppingReturnTwo | null;
}

function scoreCardTwo(
  card: MockCard,
  spend: ShoppingSpendBreakdownTwo,
  index: Map<string, MockBestOf>,
  rules: MockRule[],
  options?: EngineScoringOptions,
): CardShoppingReturnTwo {
  const online = evaluateStream(
    buildOnlineSpecs(spend.onlineAllocation),
    spend.annualOnline,
    card,
    index,
    rules,
  );
  const offline = evaluateStream(
    buildOfflineSpecs(spend.offlineAllocation, card, index),
    spend.annualOffline,
    card,
    index,
    rules,
  );
  const utility = spend.utility
    ? evaluateStream(
        buildUtilitySpecs(spend.utility),
        spend.utility.annualTotal,
        card,
        index,
        rules,
      )
    : null;

  const annualSpend =
    spend.annualOnline +
    spend.annualOffline +
    (spend.utility?.annualTotal ?? 0);
  const annualReturnInr =
    online.returnInr + offline.returnInr + (utility?.returnInr ?? 0);

  return {
    cardId: card._id,
    cardName: card.name,
    online,
    offline,
    utility,
    annualSpend,
    annualReturnInr,
    effectiveRatePercentage:
      annualSpend > 0 ? (annualReturnInr / annualSpend) * 100 : 0,
    ...finalizeCardScore(
      card,
      annualReturnInr,
      annualSpend,
      options?.milestonesBySlug?.get(card._id),
    ),
  };
}

export function recommendShoppingCardPhaseTwo(
  input: ShoppingCardPhaseTwoInput,
  cards: MockCard[],
  bestOfList: MockBestOf[],
  rules: MockRule[],
  options?: EngineScoringOptions,
): ShoppingCardEngineResultTwo {
  const spend = buildShoppingSpendBreakdownTwo(input);
  const index = buildBestOfIndex(bestOfList);

  const byCard = filterEligibleCards(cards, options?.profile)
    .map((card) => scoreCardTwo(card, spend, index, rules, options))
    .sort((a, b) => b.finalReturnInr - a.finalReturnInr);
  // Surface only the best 3 cards by final return.
  // .slice(0, 3);

  return { input, spend, byCard, best: byCard[0] ?? null };
}
