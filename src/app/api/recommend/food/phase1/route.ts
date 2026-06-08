import { ApiResponse } from "@/lib/utils/ApiResponse";
import { AdvisorCache } from "@/lib/advisor/cache";
import { recommendFoodCardPhaseOne } from "@/lib/logic/advisor/foodCardEngine";
import { foodRecommendPhaseOneInputSchema } from "@/schemas/advisor";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return ApiResponse.error("Invalid JSON body", 400);
  }

  const parsed = foodRecommendPhaseOneInputSchema.safeParse(body);
  if (!parsed.success) {
    return ApiResponse.error(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  try {
    await AdvisorCache.ensureFresh();
    const result = recommendFoodCardPhaseOne(
      parsed.data,
      AdvisorCache.cards(),
      AdvisorCache.bestOf(),
      AdvisorCache.rules(),
    );
    return ApiResponse.success("ok", 200, result);
  } catch (err) {
    console.error("[/api/recommend/food/phase1] failed:", err);
    return ApiResponse.error("Recommendation failed", 500);
  }
}
