import { ApiResponse } from "@/lib/utils/ApiResponse";
import { AdvisorCache } from "@/lib/advisor/cache";
import { recommendShoppingCardPhaseTwo } from "@/lib/logic/advisor/shoppingCardEngine";
import { shoppingRecommendInputSchema } from "@/schemas/advisor";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return ApiResponse.error("Invalid JSON body", 400);
  }

  const parsed = shoppingRecommendInputSchema.safeParse(body);
  if (!parsed.success) {
    return ApiResponse.error(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  try {
    await AdvisorCache.ensureFresh();
    const result = recommendShoppingCardPhaseTwo(
      parsed.data,
      AdvisorCache.cards(),
      AdvisorCache.bestOf(),
      AdvisorCache.rules(),
      {
        profile: {
          employmentType: parsed.data.employmentType,
          salaryRange: parsed.data.salaryRange,
        },
        milestonesBySlug: AdvisorCache.milestonesBySlug(),
      },
    );
    return ApiResponse.success("ok", 200, result);
  } catch (err) {
    console.error("[/api/recommend/shopping] failed:", err);
    return ApiResponse.error("Recommendation failed", 500);
  }
}
