// Single-transaction spend optimizer.
//
// The advisor engines answer "which card should I GET, given a year of spend".
// This answers a different question with the same machinery: "given the cards I
// ALREADY hold, which one do I swipe for THIS purchase, and should I route it
// through a voucher first?".
//
// It reuses `computeCategoryReturn` rather than reimplementing reward maths, so
// caps, tiered schedules, voucher purchase pools and merchant-specific rules all
// behave exactly as they do in the advisor. Two deliberate parameter choices
// adapt it to a single transaction:
//
//   spend           = the transaction amount (not an annual total)
//   bookingsPerYear = 1
//
// `bookingsPerYear = 1` matters: it makes the engine's trip-aware annualization
// treat the whole amount as one booking, so a per-booking voucher ceiling
// (max_voucher_size_inr × vouchers_per_booking) clamps this purchase instead of
// being spread across an imagined year of trips.
//
// The engine returns whichever lane wins. The UI shows both, so we evaluate each
// lane in isolation by handing the engine a bestOf view with the other lane's
// frontier emptied — the returned rupees are then directly comparable.
//
// IMPORTANT — why this reads CardRules and not just the CardBestOf frontiers:
// the precompute Pareto-prunes each frontier for ANNUAL planning, where spend
// can be routed to whichever merchant pays best. Only ~1.3 voucher merchants
// survive per card/category, out of ~11 raw rules (max 154). That is the right
// answer for "which card should I get", and the wrong one here: the user has
// already chosen where they're paying. Filtering the pruned frontier by their
// merchant usually yields nothing — e.g. Infinia's 10% Amazon voucher is
// discarded because a 50% Vrott voucher dominates it. So when a merchant is
// named we rebuild that merchant's candidates straight from the rules.

import type { Category, MockCard } from "./cards";
import {
  buildDirectCandidate,
  buildVoucherCandidate,
  type MockBestOf,
} from "./bestOf";
import type { MockRule } from "./rules";
import { computeCategoryReturn } from "./engine";
import { CATEGORIES } from "./cards";

/** One transaction, as the UI describes it. */
export interface SpendOptimizerInput {
  /** Transaction amount in rupees. */
  amountInr: number;
  /** Engine category (snake_case), already mapped from the UI value. */
  category: Category;
  /** Rule merchant slug (snake_case), or null for a category-wide answer. */
  merchant?: string | null;
}

export interface OptimizedCard {
  cardId: string;
  cardName: string;
  bankName: string;
  voucherSavingsInInr: number;
  directSwipeSavingsInInr: number;
  isBestCard: boolean;
  /** Which lane won for this card. */
  bestRoute: "voucher" | "swipe";
  bestSavingsInInr: number;
  /** Effective % back on the winning lane. */
  bestRatePct: number;
  /** Merchant the winning route earns through, when rule-specific. */
  merchant: string | null;
  /**
   * Brand the voucher figure is tied to. Vouchers are brand-bound, so this is
   * what makes `voucherSavingsInInr` interpretable — especially on a
   * category-wide query, where the best voucher is often a niche brand.
   */
  voucherMerchant: string | null;
  /** Human-readable cap note from the engine, when the winner is capped. */
  capNote: string | null;
  /** True when this card has no rule data and fell back to its base rate. */
  isBaseRateFallback: boolean;
}

/**
 * UI category value -> engine category. The UI uses hyphenated labels inherited
 * from the old bot prompt; the engine's vocabulary is snake_case and finer
 * grained (dining splits online/offline). Mapping is explicit so a renamed UI
 * option fails loudly here rather than silently scoring as "other".
 */
export const UI_CATEGORY_TO_ENGINE: Record<string, Category> = {
  "online-shopping": CATEGORIES.ONLINE_SHOPPING,
  "offline-retail": CATEGORIES.OFFLINE_SHOPPING,
  "food-delivery": CATEGORIES.ONLINE_FOOD_DINING,
  dining: CATEGORIES.OFFLINE_FOOD_DINING,
  flights: CATEGORIES.FLIGHTS,
  hotels: CATEGORIES.HOTELS,
  "travel-ground": CATEGORIES.TRAVEL_CABS,
  international: CATEGORIES.INTERNATIONAL_SPEND,
  forex: CATEGORIES.FOREX,
  utilities: CATEGORIES.UTILITY_BILLS,
  fuel: CATEGORIES.FUEL,
  rent: CATEGORIES.RENT,
  groceries: CATEGORIES.GROCERIES_SUPERMARKETS,
  electronics: CATEGORIES.ELECTRONICS,
  healthcare: CATEGORIES.HEALTHCARE,
  entertainment: CATEGORIES.ENTERTAINMENT,
  education: CATEGORIES.EDUCATION,
  insurance: CATEGORIES.INSURANCE,
  ott: CATEGORIES.OTT,
  "mobile-recharge": CATEGORIES.MOBILE_RECHARGE,
  "wallet-load": CATEGORIES.WALLET_RELOADS,
  jewellery: CATEGORIES.WATCHES_JEWELRY,
  "gift-card": CATEGORIES.VOUCHER,
};

export function toEngineCategory(uiValue: string): Category | null {
  return UI_CATEGORY_TO_ENGINE[uiValue] ?? null;
}

// Reverse map, for turning a merchant's rule categories back into UI options.
// Several engine categories have no UI value (the UI deliberately exposes a
// shorter list); those simply don't appear as choices.
const ENGINE_TO_UI_CATEGORY = new Map<string, string>(
  Object.entries(UI_CATEGORY_TO_ENGINE).map(([ui, engine]) => [engine, ui]),
);

export function toUiCategory(engineValue: string): string | null {
  return ENGINE_TO_UI_CATEGORY.get(engineValue) ?? null;
}

/**
 * Normalize a portal/merchant display name ("Amazon Prime 3 months") to the
 * rule merchant slug vocabulary ("amazon_prime_3_months").
 */
export function toMerchantSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * A bestOf view restricted to one lane, and optionally to one merchant.
 *
 * Emptying the other lane's frontier is what lets us price each lane on its own:
 * `computeCategoryReturn` always returns the better of the two, so with the
 * voucher frontier emptied it necessarily reports the direct-swipe answer.
 *
 * `baseTier` (the category-wide floor rule) is kept for the direct lane only —
 * it is a direct-swipe rate, and including it in a voucher-only view would let
 * the voucher lane claim direct-swipe rupees.
 *
 * Both lanes are always priced, including the voucher lane on a category-wide
 * query — the number is real and worth showing. What a category-wide query must
 * NOT do is let a voucher become the headline recommendation: a voucher is
 * bought for one specific brand, and the top-earning brand in a category is
 * usually something obscure (there are ~1,900 routes above 20%, mostly magazine
 * and gym subscriptions). `scoreCard` handles that by gating which lane can win;
 * the voucher's merchant travels back on `voucherMerchant` so the UI can label
 * the figure with the brand it actually belongs to.
 */
function laneView(
  bestOf: MockBestOf | undefined,
  lane: "voucher" | "direct",
  merchant: string | null,
  /** The card's rules for this category — used to rebuild a named merchant. */
  merchantRules: MockRule[],
  card: MockCard,
): MockBestOf | undefined {
  // With a merchant named, rebuild that merchant's candidates from the rules:
  // the pruned frontier usually doesn't contain them (see the header note).
  if (merchant !== null) {
    const rules = merchantRules.filter((r) => r.merchant === merchant);

    if (lane === "voucher") {
      const voucherFrontier = rules
        .filter((r) => r.reward.voucher_reward_percentage > 0)
        .map((r) => buildVoucherCandidate(r, card));
      if (voucherFrontier.length === 0) return undefined;
      return {
        ...(bestOf ?? emptyBestOf(card, rules)),
        directFrontier: [],
        baseTier: null,
        voucherFrontier,
      };
    }

    const base = bestOf ?? emptyBestOf(card, rules);
    return {
      ...base,
      directFrontier: rules.map((r) => buildDirectCandidate(r, card)),
      // Keep the category floor: paying at a merchant the card has no rule for
      // still earns the category-wide rate.
      baseTier: base.baseTier,
      voucherFrontier: [],
    };
  }

  // No merchant: the category-wide question the precompute already answers —
  // except when it has no answer on file.
  //
  // A missing bestOf row does NOT mean "no rules for this category". The
  // precompute discards every rule at or below the card's base rate and then
  // skips the row entirely if that leaves nothing (bestOf.ts), so a card whose
  // only fuel rule pays 0% looks identical to a card with no fuel rule at all.
  // Reading the base rule straight from the rules tells them apart: the 0% is a
  // real, stated rate and must be reported as such, not silently replaced by
  // the card's general earn rate.
  if (!bestOf) {
    if (lane === "voucher") return undefined;
    const baseRule = categoryBaseRule(merchantRules);
    if (!baseRule) return undefined;
    return {
      ...emptyBestOf(card, merchantRules),
      directFrontier: [],
      baseTier: buildDirectCandidate(baseRule, card),
      voucherFrontier: [],
    };
  }

  if (lane === "voucher") {
    if (bestOf.voucherFrontier.length === 0) return undefined;
    return { ...bestOf, directFrontier: [], baseTier: null };
  }

  return { ...bestOf, voucherFrontier: [] };
}

/**
 * The category's catch-all rule — the one with no merchant, stating what the
 * card pays for this category generally. Highest rate wins when a card has
 * several, matching how the precompute picks its baseTier.
 */
function categoryBaseRule(rules: MockRule[]): MockRule | null {
  let best: MockRule | null = null;
  for (const r of rules) {
    if (r.merchant !== null) continue;
    if (!best || r.reward.direct_swipe_percentage > best.reward.direct_swipe_percentage) {
      best = r;
    }
  }
  return best;
}

/** A bestOf shell for a card/category the precompute has no row for. */
function emptyBestOf(card: MockCard, rules: MockRule[]): MockBestOf {
  return {
    _id: `adhoc_${card._id}`,
    cardId: card._id,
    category: (rules[0]?.category ?? "other") as MockBestOf["category"],
    bestDirectSwipe: null,
    bestVoucher: null,
    directFrontier: [],
    voucherFrontier: [],
    baseTier: null,
    rulesVersion: 0,
    computedAt: new Date(0),
  };
}

function scoreCard(
  card: MockCard,
  bestOf: MockBestOf | undefined,
  input: SpendOptimizerInput,
  rulesForCategory: MockRule[],
): OptimizedCard {
  const { amountInr, category } = input;
  const merchant = input.merchant ?? null;

  const directView = laneView(bestOf, "direct", merchant, rulesForCategory, card);
  const voucherView = laneView(
    bestOf,
    "voucher",
    merchant,
    rulesForCategory,
    card,
  );

  // bookingsPerYear = 1: this is one purchase, so per-booking voucher ceilings
  // and per-period reward caps clamp against this amount alone.
  const direct = computeCategoryReturn(amountInr, category, card, directView, 1);
  const voucher = voucherView
    ? computeCategoryReturn(amountInr, category, card, voucherView, 1)
    : null;

  // `computeCategoryReturn` floors every category at the card's base earn rate,
  // which is right for the advisor ("what will this card earn me over a year")
  // and wrong here. If the category states its own rate — including 0% — that
  // rate is the answer for this transaction, and quoting the general earn rate
  // instead would promise rewards the card does not pay.
  //
  // The engine flags exactly that fall-through as `source: "fallback"`, so the
  // clamp fires only when no rule was applied; a rule-backed win is left alone.
  // Scoped here deliberately: `computeCategoryReturn` is shared by all four
  // advisor engines, and this is the optimizer's question, not theirs.
  const baseRule = categoryBaseRule(rulesForCategory);
  const directReturnInr =
    direct.source === "fallback" && baseRule
      ? (amountInr * baseRule.reward.direct_swipe_percentage) / 100
      : direct.returnInr;

  const directSwipeSavingsInInr = Math.max(0, Math.round(directReturnInr));
  const voucherSavingsInInr = voucher
    ? Math.max(0, Math.round(voucher.returnInr))
    : 0;

  // A voucher may only take the headline when the user named the merchant.
  // Otherwise the recommendation would be "buy a Vrott voucher" to someone who
  // asked about online shopping generally — the figure is still reported in
  // `voucherSavingsInInr` (labelled with `voucherMerchant`), it just can't win.
  //
  // Ties go to the direct swipe: same rupees for less friction (no voucher to
  // buy, no validity window, no partial-redemption leftovers).
  const voucherWins =
    merchant !== null && voucherSavingsInInr > directSwipeSavingsInInr;
  const winner = voucherWins ? voucher! : direct;
  const bestSavingsInInr = voucherWins
    ? voucherSavingsInInr
    : directSwipeSavingsInInr;

  return {
    cardId: card._id,
    cardName: card.name,
    bankName: card.bankId,
    voucherSavingsInInr,
    directSwipeSavingsInInr,
    isBestCard: false,
    bestRoute: voucherWins ? "voucher" : "swipe",
    bestSavingsInInr,
    bestRatePct: amountInr > 0 ? (bestSavingsInInr / amountInr) * 100 : 0,
    merchant: winner.merchant,
    // The brand the voucher figure belongs to. Without this the number is
    // uninterpretable on a category-wide query — 50% back "on online shopping"
    // reads as a lie, while 50% back "via Vrott" reads as a niche deal.
    voucherMerchant: voucher?.merchant ?? null,
    capNote: winner.capNote,
    // True only when the category has nothing on file for this card at all —
    // no precomputed row and no rule — so the figure above is the card's
    // general earn rate rather than anything category-specific. A stated rate
    // is NOT a fallback, even when it is 0%: `!bestOf` alone used to conflate
    // the two and quietly presented base-rate guesses as real answers.
    isBaseRateFallback: !bestOf && !baseRule && rulesForCategory.length === 0,
  };
}

/**
 * Score every supplied card for one transaction, best first.
 *
 * `cards` should already be the user's wallet; `bestOfIndex` is keyed
 * `${cardSlug}::${category}` (card slugs are `MockCard._id` — see AdvisorCache).
 * `rules` is the full active rule set; a merchant-specific query resolves the
 * chosen merchant from it, because the precomputed frontiers have pruned most
 * merchants away (see the header note).
 */
export function optimizeSpend(
  cards: MockCard[],
  bestOfIndex: Map<string, MockBestOf>,
  input: SpendOptimizerInput,
  rules: MockRule[] = [],
): OptimizedCard[] {
  // Index once per call rather than filtering the full rule set per card.
  // Indexed on every run, not just merchant ones: a category-wide run needs the
  // rules too, to recover a category floor the precompute dropped for being at
  // or below the card's base rate (see `laneView`).
  const rulesByCard = new Map<string, MockRule[]>();
  for (const r of rules) {
    if (r.category !== input.category) continue;
    if (!r.is_active) continue;
    const list = rulesByCard.get(r.cardId);
    if (list) list.push(r);
    else rulesByCard.set(r.cardId, [r]);
  }

  const results = cards.map((card) =>
    scoreCard(
      card,
      bestOfIndex.get(`${card._id}::${input.category}`),
      input,
      rulesByCard.get(card._id) ?? [],
    ),
  );

  results.sort(
    (a, b) =>
      b.bestSavingsInInr - a.bestSavingsInInr ||
      // Stable, meaningful tiebreak: prefer the card that also wins on the
      // lane it didn't win with, then fall back to name for determinism.
      b.directSwipeSavingsInInr - a.directSwipeSavingsInInr ||
      a.cardName.localeCompare(b.cardName),
  );

  if (results.length > 0 && results[0].bestSavingsInInr > 0) {
    results[0].isBestCard = true;
  }

  return results;
}

/** Build the `${cardSlug}::${category}` index the optimizer expects. */
export function buildBestOfIndex(list: MockBestOf[]): Map<string, MockBestOf> {
  const index = new Map<string, MockBestOf>();
  for (const b of list) index.set(`${b.cardId}::${b.category}`, b);
  return index;
}
