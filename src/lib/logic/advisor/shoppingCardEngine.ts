import { CATEGORIES, MOCK_CARDS, type Category, type MockCard } from "./cards";
import { MOCK_BEST_OF, computeBestOfForCard, type MockBestOf } from "./bestOf";
import { MERCHANTS, MOCK_RULES, type Merchant, type MockRule } from "./rules";
import { computeCategoryReturn, type CategoryReturn } from "./engine";

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
      return { online: 0.75, offline: 0.25 };
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

  // Multiple specific platforms → split evenly across platforms + one "others"
  // bucket (n+1 even shares). If the user also picked "I shop across many",
  // it's already represented by the "others" bucket — no extra share added.
  const buckets = specific.length + 1;
  const share = 1 / buckets;
  const out: OnlinePlatformAllocation[] = specific.map((p) => ({
    merchant: PLATFORM_TO_MERCHANT[p],
    label: PLATFORM_LABEL[p],
    spend: onlineSpend * share,
  }));
  out.push({
    merchant: null,
    label: "Other online platforms",
    spend: onlineSpend * share,
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

export interface CardShoppingReturn {
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

// Merchant-scoped best-of: reruns best-of against just the merchant's rules.
// Returns undefined when the card has no rule for that merchant — caller
// then falls back to the card's base rate.
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

function fallbackRate(card: MockCard, category: Category): number {
  if (card.excluded_categories?.includes(category)) return 0;
  return card.rewards.base_reward_rate;
}

function buildOnlineSpecs(spend: ShoppingSpendBreakdown): ShoppingSubSpec[] {
  return spend.onlineAllocation
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
            kind: "fallback",
            label: a.label,
            spend: a.spend,
            category: CATEGORIES.ONLINE_SHOPPING,
          },
    );
}

function buildOfflineSpecs(spend: ShoppingSpendBreakdown): ShoppingSubSpec[] {
  if (spend.offlineAllocation.spend <= 0) return [];
  return [
    {
      kind: "category-best",
      label: spend.offlineAllocation.label,
      spend: spend.offlineAllocation.spend,
      category: CATEGORIES.OFFLINE_SHOPPING,
    },
  ];
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
): CardShoppingReturn {
  const online = evaluateStream(
    buildOnlineSpecs(spend),
    spend.annualOnline,
    card,
    index,
    rules,
  );
  const offline = evaluateStream(
    buildOfflineSpecs(spend),
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
  };
}

export function recommendShoppingCardPhaseOne(
  input: ShoppingCardPhaseOneInput,
  cards: MockCard[] = MOCK_CARDS,
  bestOfList: MockBestOf[] = MOCK_BEST_OF,
  rules: MockRule[] = MOCK_RULES,
): ShoppingCardEngineResult {
  const spend = buildShoppingSpendBreakdown(input);
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
