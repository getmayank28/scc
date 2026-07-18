import { ApiResponse } from "@/lib/utils/ApiResponse";
import { AdvisorCache } from "@/lib/advisor/cache";
import { recommendTravelCardAdvanced } from "@/lib/logic/advisor/engine";
import { recommendFoodCardPhaseTwo } from "@/lib/logic/advisor/foodCardEngine";
import { recommendShoppingCardPhaseTwo } from "@/lib/logic/advisor/shoppingCardEngine";
import { recommendAllRounderCardPhaseTwo } from "@/lib/logic/advisor/allrounderEngine";
import {
  travelRecommendInputSchema,
  foodRecommendInputSchema,
  shoppingRecommendInputSchema,
  allrounderRecommendInputSchema,
} from "@/schemas/advisor";
import {
  toRecommendationCards,
  type EngineResult,
  type RecommendCategory,
} from "@/lib/logic/advisor/present/cards";
import { buildNarrative } from "@/lib/logic/advisor/present/narrative";

export const runtime = "nodejs";

// `CardsType` from the FE uses "rounder"; the engine/schema use "allrounder".
// Reconcile here, in the single dispatch point.
function toRecommendCategory(raw: unknown): RecommendCategory | null {
  switch (raw) {
    case "travel":
      return "travel";
    case "food":
      return "food";
    case "shopping":
      return "shopping";
    case "rounder":
    case "allrounder":
      return "allrounder";
    default:
      return null;
  }
}

const SCHEMA = {
  travel: travelRecommendInputSchema,
  food: foodRecommendInputSchema,
  shopping: shoppingRecommendInputSchema,
  allrounder: allrounderRecommendInputSchema,
} as const;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return ApiResponse.error("Invalid JSON body", 400);
  }

  const { category: rawCategory, input } =
    (body as { category?: unknown; input?: unknown }) ?? {};

  const category = toRecommendCategory(rawCategory);
  if (!category) {
    return ApiResponse.error("Unknown or missing card category", 400);
  }

  const parsed = SCHEMA[category].safeParse(input);
  if (!parsed.success) {
    return ApiResponse.error(
      parsed.error.issues[0]?.message ?? "Invalid input",
      400,
    );
  }

  try {
    await AdvisorCache.ensureFresh();
    const cards = AdvisorCache.cards();
    const bestOf = AdvisorCache.bestOf();
    const rules = AdvisorCache.rules();

    let result: EngineResult;
    switch (category) {
      case "travel":
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result = recommendTravelCardAdvanced(parsed.data as any, cards, bestOf);
        break;
      case "food":
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result = recommendFoodCardPhaseTwo(parsed.data as any, cards, bestOf, rules);
        break;
      case "shopping":
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result = recommendShoppingCardPhaseTwo(parsed.data as any, cards, bestOf, rules);
        break;
      case "allrounder":
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result = recommendAllRounderCardPhaseTwo(parsed.data as any, cards, bestOf, rules);
        break;
    }

    const recommendationCards = toRecommendationCards(category, result, cards);
    const { startMessage, endMessage } = buildNarrative(category, result);

    // The chat renders this exact shape (see isCardRecommendationResponse /
    // ScrollableArea). `cards` is always an array, never omitted.
    return ApiResponse.success("ok", 200, {
      startMessage,
      cards: recommendationCards,
      endMessage,
    });
  } catch (err) {
    console.error("[/api/recommend] failed:", err);
    return ApiResponse.error("Recommendation failed", 500);
  }
}
