import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import { ApiResponse } from "@/lib/utils/ApiResponse";
import { AdvisorCache } from "@/lib/advisor/cache";
import dbConnect from "@/lib/utils/dbConnet";
import UserCardModel from "@/models/UserCard";
import "@/models/Card";
import {
  optimizeSpend,
  buildBestOfIndex,
  toEngineCategory,
  toMerchantSlug,
} from "@/lib/logic/advisor/spendOptimizer";
import { spendOptimizerInputSchema } from "@/schemas/spendOptimizer";
import type { MockCard } from "@/lib/logic/advisor/cards";

export const runtime = "nodejs";

interface PopulatedUserCard {
  cardId?: { slug?: string } | null;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?._id;
  if (!userId) return ApiResponse.error("Unauthorized", 401);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return ApiResponse.error("Invalid JSON body", 400);
  }

  const parsed = spendOptimizerInputSchema.safeParse(body);
  if (!parsed.success) {
    return ApiResponse.error(
      parsed.error.issues[0]?.message ?? "Invalid input",
      400,
    );
  }
  const { category, amountInr, merchant, cardSlugs } = parsed.data;

  const engineCategory = toEngineCategory(category);
  if (!engineCategory) {
    return ApiResponse.error(`Unsupported category: ${category}`, 400);
  }

  try {
    await dbConnect();

    // Resolve the wallet server-side: a client may narrow the comparison to
    // cards it owns, but never widen it to cards it doesn't.
    const owned = await UserCardModel.find({ userId })
      .populate("cardId", "slug")
      .lean<PopulatedUserCard[]>();

    const ownedSlugs = new Set(
      owned
        .map((u) => u.cardId?.slug)
        .filter((s): s is string => typeof s === "string" && s.length > 0),
    );

    if (ownedSlugs.size === 0) {
      return ApiResponse.success("No cards in wallet", 200, {
        cards: [],
        category: engineCategory,
        merchant: null,
      });
    }

    const requested =
      cardSlugs && cardSlugs.length > 0
        ? cardSlugs.filter((s) => ownedSlugs.has(s))
        : [...ownedSlugs];

    if (requested.length === 0) {
      return ApiResponse.error("None of the requested cards are in your wallet", 400);
    }

    // Deliberately NOT AdvisorCache.ensureFresh(): a cold hydrate pulls ~81k
    // rules (~71 MB) and ~6.5k bestOf payloads (~13 MB), which cost minutes on a
    // cold start. This endpoint needs only the wallet's cards in one category,
    // so it reads that slice directly (and still serves from the snapshot when
    // another request has already warmed it).
    //
    // Includes discontinued cards: the user holds them, so they must be scored
    // even though the advisor would never recommend applying for one.
    const cards: MockCard[] =
      await AdvisorCache.cardsBySlugIncludingInactive(requested);

    if (cards.length === 0) {
      return ApiResponse.error(
        "Your cards are not yet supported by the optimizer",
        422,
      );
    }

    // Anything still unresolved has no card record at all. Name them so the UI
    // can say which cards were left out instead of quietly returning fewer rows
    // than the user selected.
    const scored = new Set(cards.map((c) => c._id));
    const unsupportedCards = requested.filter((s) => !scored.has(s));

    // Only pass a merchant the rule vocabulary actually knows; an unmatched
    // name would filter every frontier to empty and silently zero the result.
    const merchantSlug = merchant ? toMerchantSlug(merchant) : null;

    const scoredSlugs = cards.map((c) => c._id);
    const [bestOf, rules, merchantKnown] = await Promise.all([
      AdvisorCache.bestOfForCards(scoredSlugs, engineCategory),
      // Always read the rules, not just for a named merchant. The precompute
      // drops any rule at or below the card's base rate (bestOf.ts) and writes
      // no row at all when that leaves nothing — so a missing bestOf row means
      // either "no rule" or "a rule that pays less than base". Only the rules
      // themselves tell the two apart, and the optimizer must report the real
      // rate rather than falling back to base. Bounded: the wallet's cards
      // (<= 3) in one category, served from the warm snapshot when present.
      AdvisorCache.rulesForCards(scoredSlugs, engineCategory),
      merchantSlug
        ? AdvisorCache.merchantExists(merchantSlug)
        : Promise.resolve(false),
    ]);

    const knownMerchant = merchantKnown ? merchantSlug : null;

    const result = optimizeSpend(
      cards,
      buildBestOfIndex(bestOf),
      { amountInr, category: engineCategory, merchant: knownMerchant },
      rules,
    );

    return ApiResponse.success("ok", 200, {
      cards: result,
      category: engineCategory,
      merchant: knownMerchant,
      // Surfaces "we ignored the merchant you picked" so the UI can say the
      // answer is category-wide rather than merchant-specific.
      merchantMatched: Boolean(knownMerchant),
      unsupportedCards,
      unsupportedCardCount: unsupportedCards.length,
    });
  } catch (err) {
    console.error("[/api/spend-optimizer] failed:", err);
    return ApiResponse.error("Spend optimization failed", 500);
  }
}
