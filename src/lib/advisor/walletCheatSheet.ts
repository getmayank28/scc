import { AdvisorCache } from "@/lib/advisor/cache";
import {
  optimizeSpend,
  buildBestOfIndex,
  toEngineCategory,
  toMerchantSlug,
  type OptimizedCard,
} from "@/lib/logic/advisor/spendOptimizer";

/**
 * The everyday spends the home cheat sheet answers "which of my cards?" for.
 *
 * Merchants are the ones users actually look up most in the optimizer; the
 * category rows cover common spends that have no single merchant. Amounts are
 * a typical ticket for each, because caps make the effective rate depend on
 * the amount — a ₹50k figure would understate a card capped at ₹1k a month.
 *
 * `category` is the optimizer's UI value, so a row can deep-link straight into
 * /spend-optimizer with the same inputs and get the same answer.
 */
export const CHEAT_SHEET_TARGETS = [
  { key: "amazon", label: "Amazon", merchant: "Amazon", category: "online-shopping", amountInr: 5000 },
  { key: "flipkart", label: "Flipkart", merchant: "Flipkart", category: "online-shopping", amountInr: 5000 },
  { key: "myntra", label: "Myntra", merchant: "Myntra", category: "online-shopping", amountInr: 3000 },
  { key: "swiggy", label: "Swiggy", merchant: "Swiggy", category: "food-delivery", amountInr: 1000 },
  { key: "zomato", label: "Zomato", merchant: "Zomato", category: "food-delivery", amountInr: 1000 },
  { key: "flights", label: "Flights", merchant: null, category: "flights", amountInr: 10000 },
  { key: "hotels", label: "Hotels", merchant: null, category: "hotels", amountInr: 10000 },
  { key: "fuel", label: "Fuel", merchant: null, category: "fuel", amountInr: 3000 },
  { key: "utilities", label: "Utility bills", merchant: null, category: "utilities", amountInr: 3000 },
] as const;

/**
 * A popular card everyone recognises, scored the same way as a real wallet,
 * shown faded to users with nothing of their own to show yet.
 */
export const EXAMPLE_CARD_SLUG = "cashback-sbi-card-sbi-card";

export interface CheatSheetRow {
  key: string;
  label: string;
  /** Display merchant name, or null for a category-wide row. */
  merchant: string | null;
  /** Optimizer UI category value. */
  category: string;
  amountInr: number;
  best: Pick<
    OptimizedCard,
    | "cardId"
    | "cardName"
    | "bankName"
    | "bestRoute"
    | "bestRatePct"
    | "bestSavingsInInr"
    | "voucherMerchant"
    | "directMerchant"
    | "isBaseRateFallback"
  > | null;
  /** Rate of the second-best card, so the UI can say how much the pick matters. */
  runnerUpRatePct: number | null;
}

export interface CheatSheetCard {
  slug: string;
  name: string;
  /** Same value the optimizer returns as `bankName` (the card's bankId). */
  bankName: string;
}

export interface CheatSheet {
  /** Every wallet card that resolved, including ones that win nothing. */
  cards: CheatSheetCard[];
  rows: CheatSheetRow[];
}

/**
 * Score every cheat-sheet target against the given wallet cards.
 *
 * Mirrors the scoring path of POST /api/spend-optimizer (same card resolution,
 * same bestOf/rules slice, same merchant check) so a row here and the
 * optimizer's answer for the same inputs cannot disagree.
 */
export async function buildWalletCheatSheet(
  walletSlugs: string[],
): Promise<CheatSheet> {
  const cards = await AdvisorCache.cardsBySlugIncludingInactive(walletSlugs);
  if (cards.length === 0) return { cards: [], rows: [] };
  const slugs = cards.map((c) => c._id);

  const rows = await Promise.all(
    CHEAT_SHEET_TARGETS.map(async (t): Promise<CheatSheetRow> => {
      const engineCategory = toEngineCategory(t.category)!;
      const merchantSlug = t.merchant ? toMerchantSlug(t.merchant) : null;

      const [bestOf, rules, merchantKnown] = await Promise.all([
        AdvisorCache.bestOfForCards(slugs, engineCategory),
        AdvisorCache.rulesForCards(slugs, engineCategory),
        merchantSlug
          ? AdvisorCache.merchantExists(merchantSlug)
          : Promise.resolve(false),
      ]);

      const result = optimizeSpend(
        cards,
        buildBestOfIndex(bestOf),
        {
          amountInr: t.amountInr,
          category: engineCategory,
          merchant: merchantKnown ? merchantSlug : null,
        },
        rules,
      );

      const [first, second] = result;
      return {
        key: t.key,
        label: t.label,
        merchant: t.merchant,
        category: t.category,
        amountInr: t.amountInr,
        best: first
          ? {
              cardId: first.cardId,
              cardName: first.cardName,
              bankName: first.bankName,
              bestRoute: first.bestRoute,
              bestRatePct: first.bestRatePct,
              bestSavingsInInr: first.bestSavingsInInr,
              voucherMerchant: first.voucherMerchant,
              directMerchant: first.directMerchant,
              isBaseRateFallback: first.isBaseRateFallback,
            }
          : null,
        runnerUpRatePct: second?.bestRatePct ?? null,
      };
    }),
  );

  return {
    cards: cards.map((c) => ({ slug: c._id, name: c.name, bankName: c.bankId })),
    rows,
  };
}
