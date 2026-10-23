import { AdvisorCache } from "@/lib/advisor/cache";
import UserCardModel from "@/models/UserCard";
import "@/models/Card";
import {
  buildBestOfIndex,
  optimizeSpend,
  toMerchantSlug,
} from "@/lib/logic/advisor/spendOptimizer";
import { CATEGORIES, type Category, type MockCard } from "@/lib/logic/advisor/cards";
import type { DealBestCard } from "@/types/deals";

/**
 * Which of a user's own cards to pay with at each merchant — the spend
 * optimizer's answer, computed server-side for many merchants at once.
 *
 * Deals carry no purchase amount, so cards are compared at a representative
 * basket and only the winning card and its rate are returned, never a rupee
 * figure (which would depend on the real basket and on caps).
 */

const REPRESENTATIVE_AMOUNT_INR = 5000;

/**
 * Fallback category by portal type, for merchants with no merchant-specific
 * rule. Online shopping is the right floor for most portals.
 */
const CATEGORY_BY_PORTAL_TYPE: Record<string, Category> = {
  "food-and-delivery": CATEGORIES.ONLINE_FOOD_DINING,
  grocery: CATEGORIES.GROCERIES_SUPERMARKETS,
  travel: CATEGORIES.OTHER_TRAVEL,
  healthcare: CATEGORIES.HEALTHCARE,
  education: CATEGORIES.EDUCATION,
};

export interface MerchantRef {
  portalSlug: string;
  name: string;
  portalType?: string | null;
}

interface PopulatedUserCard {
  cardId?: { slug?: string } | null;
}

/** The user's scoreable cards; empty when the wallet is. */
export async function walletCards(userId: string): Promise<MockCard[]> {
  const owned = await UserCardModel.find({ userId })
    .populate("cardId", "slug")
    .lean<PopulatedUserCard[]>();
  const slugs = [
    ...new Set(owned.map((u) => u.cardId?.slug).filter((s): s is string => !!s)),
  ];
  return slugs.length ? AdvisorCache.cardsBySlugIncludingInactive(slugs) : [];
}

/** Engine category and rule merchant to score a portal under. */
async function scoringKey(m: MerchantRef): Promise<{ category: Category; merchant: string | null }> {
  // Rules are keyed on the merchant's display name slugged ("Tata CLiQ" →
  // "tata_cliq"); try that, then the portal slug in the same form.
  for (const candidate of [toMerchantSlug(m.name), toMerchantSlug(m.portalSlug)]) {
    if (!candidate) continue;
    const cats = (await AdvisorCache.categoriesForMerchant(candidate)) as Category[];
    if (cats.length) {
      const category = cats.includes(CATEGORIES.ONLINE_SHOPPING)
        ? CATEGORIES.ONLINE_SHOPPING
        : cats[0];
      return { category, merchant: candidate };
    }
  }
  return {
    category: CATEGORY_BY_PORTAL_TYPE[m.portalType ?? ""] ?? CATEGORIES.ONLINE_SHOPPING,
    merchant: null,
  };
}

export async function bestCardsFor(
  cards: MockCard[],
  merchants: MerchantRef[],
): Promise<Map<string, DealBestCard | null>> {
  const out = new Map<string, DealBestCard | null>();
  if (!cards.length) {
    for (const m of merchants) out.set(m.portalSlug, null);
    return out;
  }
  const slugs = cards.map((c) => c._id);

  // Several merchants usually share a category; read its rules once.
  const byCategory = new Map<
    Category,
    Promise<[Awaited<ReturnType<typeof AdvisorCache.bestOfForCards>>, Awaited<ReturnType<typeof AdvisorCache.rulesForCards>>]>
  >();
  const slice = (category: Category) => {
    if (!byCategory.has(category)) {
      byCategory.set(
        category,
        Promise.all([
          AdvisorCache.bestOfForCards(slugs, category),
          AdvisorCache.rulesForCards(slugs, category),
        ]),
      );
    }
    return byCategory.get(category)!;
  };

  await Promise.all(
    merchants.map(async (m) => {
      const { category, merchant } = await scoringKey(m);
      const [bestOf, rules] = await slice(category);
      const result = optimizeSpend(
        cards,
        buildBestOfIndex(bestOf),
        { amountInr: REPRESENTATIVE_AMOUNT_INR, category, merchant },
        rules,
      );
      const best = result.find((r) => r.isBestCard) ?? result[0];
      out.set(
        m.portalSlug,
        best
          ? {
              cardId: best.cardId,
              cardName: best.cardName,
              ratePct: Math.round(best.bestRatePct * 100) / 100,
              route: best.bestRoute,
              merchantSpecific: merchant !== null,
            }
          : null,
      );
    }),
  );
  return out;
}
