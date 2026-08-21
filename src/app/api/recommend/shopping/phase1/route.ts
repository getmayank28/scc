import { ApiResponse } from "@/lib/utils/ApiResponse";
import { AdvisorCache } from "@/lib/advisor/cache";
import { recommendShoppingCardPhaseOne } from "@/lib/logic/advisor/shoppingCardEngine";
import { shoppingRecommendPhaseOneInputSchema } from "@/schemas/advisor";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return ApiResponse.error("Invalid JSON body", 400);
  }

  const parsed = shoppingRecommendPhaseOneInputSchema.safeParse(body);
  if (!parsed.success) {
    return ApiResponse.error(
      parsed.error.issues[0]?.message ?? "Invalid input",
      400,
    );
  }

  try {
    await AdvisorCache.ensureFresh();
    const result = recommendShoppingCardPhaseOne(
      parsed.data,
      AdvisorCache.cards(),
      AdvisorCache.bestOf(),
      await AdvisorCache.rulesForEngine("shopping"),
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
    console.error("[/api/recommend/shopping/phase1] failed:", err);
    return ApiResponse.error("Recommendation failed", 500);
  }
}
