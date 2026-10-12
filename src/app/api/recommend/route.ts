import type { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import { ApiResponse } from "@/lib/utils/ApiResponse";
import { AdvisorCache } from "@/lib/advisor/cache";
import dbConnect from "@/lib/utils/dbConnet";
import UserModel from "@/models/User";
import {
  recommendTravelCard,
  recommendTravelCardAdvanced,
} from "@/lib/logic/advisor/engine";
import {
  recommendFoodCardPhaseOne,
  recommendFoodCardPhaseTwo,
} from "@/lib/logic/advisor/foodCardEngine";
import {
  recommendShoppingCardPhaseOne,
  recommendShoppingCardPhaseTwo,
} from "@/lib/logic/advisor/shoppingCardEngine";
import {
  recommendAllRounderCardPhaseOne,
  recommendAllRounderCardPhaseTwo,
} from "@/lib/logic/advisor/allrounderEngine";
import {
  travelRecommendInputSchema,
  travelRecommendPhaseOneInputSchema,
  foodRecommendInputSchema,
  foodRecommendPhaseOneInputSchema,
  shoppingRecommendInputSchema,
  shoppingRecommendPhaseOneInputSchema,
  allrounderRecommendInputSchema,
  allrounderRecommendPhaseOneInputSchema,
} from "@/schemas/advisor";
import type { UserProfile } from "@/lib/logic/advisor/scoring";
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

// The journey submits twice: once early (phase 1, few answers) and again after
// the fine-tune questions (phase 2, declared spend). Phase 1 is the default —
// every journey's `submit` fires before any phase-2 question is asked.
type Phase = 1 | 2;

function toPhase(raw: unknown): Phase {
  return raw === 2 || raw === "2" ? 2 : 1;
}

const SCHEMA = {
  travel: {
    1: travelRecommendPhaseOneInputSchema,
    2: travelRecommendInputSchema,
  },
  food: {
    1: foodRecommendPhaseOneInputSchema,
    2: foodRecommendInputSchema,
  },
  shopping: {
    1: shoppingRecommendPhaseOneInputSchema,
    2: shoppingRecommendInputSchema,
  },
  allrounder: {
    1: allrounderRecommendPhaseOneInputSchema,
    2: allrounderRecommendInputSchema,
  },
} as const;

// The signed-in user's declared profile drives the income-eligibility filter
// (Step 1 of the scoring pipeline). Read it from the session rather than the
// request body so a client can't spoof income to unlock premium cards.
async function profileForSession(): Promise<UserProfile | undefined> {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?._id;
    if (!userId) return undefined;

    await dbConnect();
    const user = await UserModel.findById(userId)
      .select("employmentType salaryRange")
      .lean<{ employmentType?: string; salaryRange?: string } | null>();
    if (!user?.employmentType) return undefined;

    return {
      employmentType: user.employmentType,
      salaryRange: user.salaryRange,
    } as UserProfile;
  } catch (err) {
    // An unreadable profile must not break the recommendation — the engines
    // treat an absent profile as "unknown income, don't filter".
    console.error("[/api/recommend] profile lookup failed:", err);
    return undefined;
  }
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return ApiResponse.error("Invalid JSON body", 400);
  }

  const {
    category: rawCategory,
    phase: rawPhase,
    input,
  } = (body as { category?: unknown; phase?: unknown; input?: unknown }) ?? {};

  const category = toRecommendCategory(rawCategory);
  if (!category) {
    return ApiResponse.error("Unknown or missing card category", 400);
  }

  const phase = toPhase(rawPhase);

  const parsed = SCHEMA[category][phase].safeParse(input);
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
    // Only this engine's rule categories are fetched (travel needs none), so a
    // cold request pulls a few MB instead of the full ~62 MB rule catalogue.
    const [rules, profile] = await Promise.all([
      category === "travel"
        ? Promise.resolve([])
        : AdvisorCache.rulesForEngine(category),
      profileForSession(),
    ]);
    const options = {
      profile,
      milestonesBySlug: AdvisorCache.milestonesBySlug(),
    };

    // `SCHEMA[category][phase]` is a union across all 8 schemas, so
    // `parsed.data` stays a union that the switch below can't narrow. Each
    // branch re-reads the value through its own schema's inferred type; the
    // runtime value has already been validated by that same schema above.
    const data = parsed.data;

    let result: EngineResult;
    switch (category) {
      case "travel":
        result =
          phase === 1
            ? recommendTravelCard(
                data as z.infer<typeof travelRecommendPhaseOneInputSchema>,
                cards,
                bestOf,
                options,
              )
            : recommendTravelCardAdvanced(
                data as z.infer<typeof travelRecommendInputSchema>,
                cards,
                bestOf,
                options,
              );
        break;
      case "food":
        result =
          phase === 1
            ? recommendFoodCardPhaseOne(
                data as z.infer<typeof foodRecommendPhaseOneInputSchema>,
                cards,
                bestOf,
                rules,
                options,
              )
            : recommendFoodCardPhaseTwo(
                data as z.infer<typeof foodRecommendInputSchema>,
                cards,
                bestOf,
                rules,
                options,
              );
        break;
      case "shopping":
        result =
          phase === 1
            ? recommendShoppingCardPhaseOne(
                data as z.infer<typeof shoppingRecommendPhaseOneInputSchema>,
                cards,
                bestOf,
                rules,
                options,
              )
            : recommendShoppingCardPhaseTwo(
                data as z.infer<typeof shoppingRecommendInputSchema>,
                cards,
                bestOf,
                rules,
                options,
              );
        break;
      case "allrounder":
        result =
          phase === 1
            ? recommendAllRounderCardPhaseOne(
                data as z.infer<typeof allrounderRecommendPhaseOneInputSchema>,
                cards,
                bestOf,
                rules,
                options,
              )
            : recommendAllRounderCardPhaseTwo(
                data as z.infer<typeof allrounderRecommendInputSchema>,
                cards,
                bestOf,
                rules,
                options,
              );
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
