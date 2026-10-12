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
  /**
   * Merchant the direct-swipe figure earns through, when a merchant-specific
   * rule won the direct lane. Same purpose as `voucherMerchant`, for the other
   * column: on a category-wide query the winning direct rule is often tied to
   * one channel (e.g. a bank's own portal), and an unlabelled rate reads as if
   * the whole category pays it. null when the category floor won, which is
   * genuinely category-wide and has no merchant to name.
   */
  directMerchant: string | null;
  /** Human-readable cap note from the engine, when the winner is capped. */
  capNote: string | null;
  /** True when this card has no rule data and fell back to its base rate. */
  isBaseRateFallback: boolean;
}

/**
 * The UI value for "we don't know what this spend is" — scored at each card's
 * base rate. Named rather than inlined because the client, the input schema and
 * the map below all have to agree on the exact string.
 */
export const OTHER_SPEND_CATEGORY = "other-spend";

/**
 * UI category value -> engine category. The UI uses hyphenated labels inherited
 * from the old bot prompt; the engine's vocabulary is snake_case and finer
 * grained (dining splits online/offline). Mapping is explicit so a renamed UI
 * option fails loudly here rather than silently scoring as the catch-all.
 */
export const UI_CATEGORY_TO_ENGINE: Record<string, Category> = {
  // Not offered in the category dropdown (see `categories` in the optimizer's
  // data.ts), but kept here because the quick-merchant tiles run them: Amazon
  // and Flipkart are online shopping, Swiggy and Zomato are food delivery.
  // Removing them would make those tiles POST a category the schema rejects,
  // since the enum below is derived from this map.
  "online-shopping": CATEGORIES.ONLINE_SHOPPING,
  "food-delivery": CATEGORIES.ONLINE_FOOD_DINING,

  flights: CATEGORIES.FLIGHTS,
  hotels: CATEGORIES.HOTELS,
  international: CATEGORIES.INTERNATIONAL_SPEND,
  utilities: CATEGORIES.UTILITY_BILLS,
  fuel: CATEGORIES.FUEL,
  rent: CATEGORIES.RENT,
  healthcare: CATEGORIES.HEALTHCARE,
  education: CATEGORIES.EDUCATION,
  insurance: CATEGORIES.INSURANCE,
  "mobile-recharge": CATEGORIES.MOBILE_RECHARGE,
  jewellery: CATEGORIES.WATCHES_JEWELRY,
  taxes: CATEGORIES.TAXES,
  "government-payments": CATEGORIES.GOVERNMENT_PAYMENTS,
  "emi-spend": CATEGORIES.EMI_SPEND,
  investment: CATEGORIES.INVESTMENT,
  "forex-charge": CATEGORIES.FOREX_CHARGE,
  internet: CATEGORIES.INTERNET,
  "business-expenses": CATEGORIES.BUSINESS_EXPENSES,
  pharmacy: CATEGORIES.PHARMACY,
  "parking-toll": CATEGORIES.PARKING_TOLL,
  "auto-services": CATEGORIES.AUTO_SERVICES,
  // The catch-all. No card carries `other` rules or a bestOf row, so every card
  // scores at its own base earn rate — which is exactly the right answer for a
  // spend we can't place in any named category (an unrecognised merchant).
  [OTHER_SPEND_CATEGORY]: CATEGORIES.OTHER,
};

/**
 * Categories where a voucher may win the headline even on a category-wide run.
 *
 * The general rule (see `scoreCard`) keeps vouchers out of the headline unless
 * the user named a merchant, because the top-earning voucher brand in a
 * category is usually something obscure — online shopping's frontier is led by
 * Vinci Botanicals and Typsy Beauty, and "buy a Typsy Beauty voucher" is no
 * answer to "where should I shop online".
 *
 * Flights and hotels are the exception, and the data is what makes them one.
 * Their voucher frontiers hold 7 and 17 merchants respectively, and every one
 * is a mainstream booking portal or hotel chain — Cleartrip, MakeMyTrip,
 * EaseMyTrip, Ixigo, Air India, ITC, Marriott. A traveller books a trip, not a
 * portal, and is indifferent about which of these sells it, so naming one costs
 * them nothing. Suppressing the voucher there just hides the better answer: on
 * hotels the Amex MRCC earns 15.9% through a Cleartrip voucher against 2% on a
 * direct swipe.
 */
const VOUCHER_HEADLINE_CATEGORIES = new Set<Category>([
  CATEGORIES.FLIGHTS,
  CATEGORIES.HOTELS,
]);

/**
 * Categories that always recommend the direct swipe, even when a voucher pays
 * more and even when the user named the merchant.
 *
 * These are bill-type and regulated spends where a gift voucher is the wrong
 * instrument regardless of the arithmetic: the payee is a utility, a tax
 * authority, an insurer, a landlord or a fuel pump, and either won't accept a
 * voucher at all or the spend is a fixed obligation that can't be reshaped
 * around one. Recommending "buy a voucher" for a tax payment is not a better
 * deal, it's unusable advice — so the voucher figure stays reported in
 * `voucherSavingsInInr` but can never take the headline.
 *
 * This is a stronger rule than the default: the default merely requires the
 * user to have named a merchant, whereas these categories suppress the voucher
 * headline outright. Where both could apply, this one wins.
 */
const DIRECT_SWIPE_ONLY_CATEGORIES = new Set<Category>([
  CATEGORIES.UTILITY_BILLS,
  CATEGORIES.TAXES,
  CATEGORIES.EDUCATION,
  CATEGORIES.INTERNATIONAL_SPEND,
  CATEGORIES.FUEL,
  CATEGORIES.INSURANCE,
  CATEGORIES.GOVERNMENT_PAYMENTS,
  CATEGORIES.EMI_SPEND,
  CATEGORIES.RENT,
  CATEGORIES.INVESTMENT,
  CATEGORIES.FOREX_CHARGE,
  CATEGORIES.MOBILE_RECHARGE,
  CATEGORIES.INTERNET,
  CATEGORIES.BUSINESS_EXPENSES,
  CATEGORIES.HEALTHCARE,
  CATEGORIES.PHARMACY,
  CATEGORIES.PARKING_TOLL,
  CATEGORIES.AUTO_SERVICES,
  // Kept although the picker no longer offers jewellery (the category has no
  // rules at all): the policy should already be right if the data lands later.
  CATEGORIES.WATCHES_JEWELRY,
]);

export function toEngineCategory(uiValue: string): Category | null {
  return UI_CATEGORY_TO_ENGINE[uiValue] ?? null;
}

/**
 * True when a category always recommends the direct swipe, addressed by its UI
 * value rather than its engine one.
 *
 * Derived from DIRECT_SWIPE_ONLY_CATEGORIES rather than listed again, so the
 * scoring policy and anything the UI says about it cannot drift apart.
 */
export function isDirectSwipeOnlyUiCategory(uiValue: string): boolean {
  const engine = UI_CATEGORY_TO_ENGINE[uiValue];
  return engine !== undefined && DIRECT_SWIPE_ONLY_CATEGORIES.has(engine);
}

// Reverse map, for turning a merchant's rule categories back into UI options.
// Several engine categories have no UI value (the UI deliberately exposes a
// shorter list); those simply don't appear as choices.
//
// The catch-all is excluded in this direction: it exists so an unplaceable
// spend can be scored at base rate, and offering it as one of a merchant's
// categories would present it as a thing the user chose rather than the
// fallback it is.
const ENGINE_TO_UI_CATEGORY = new Map<string, string>(
  Object.entries(UI_CATEGORY_TO_ENGINE)
    .filter(([ui]) => ui !== OTHER_SPEND_CATEGORY)
    .map(([ui, engine]) => [engine, ui]),
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

  // Bill-type categories never headline a voucher, whatever it pays — see
  // DIRECT_SWIPE_ONLY_CATEGORIES.
  //
  // Otherwise a voucher may normally only take the headline when the user named
  // the merchant. Otherwise the recommendation would be "buy a Vrott voucher" to
  // someone who asked about online shopping generally — the figure is still
  // reported in `voucherSavingsInInr` (labelled with `voucherMerchant`), it
  // just can't win.
  //
  // Ties go to the direct swipe: same rupees for less friction (no voucher to
  // buy, no validity window, no partial-redemption leftovers).
  const voucherWins =
    !DIRECT_SWIPE_ONLY_CATEGORIES.has(category) &&
    (merchant !== null || VOUCHER_HEADLINE_CATEGORIES.has(category)) &&
    voucherSavingsInInr > directSwipeSavingsInInr;
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
    // The brand the direct figure belongs to. Read off `direct`, not `winner` —
    // on a voucher win `winner.merchant` is the voucher's brand, which would
    // mislabel the swipe column with a merchant it doesn't earn through. Null
    // when the clamp above replaced the engine's answer with the category
    // floor: that rate is the merchant-null base rule's, so naming a merchant
    // would attribute it to a channel that didn't earn it.
    directMerchant:
      direct.source === "fallback" && baseRule ? null : direct.merchant,
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
