import { ApiResponse } from "@/lib/utils/ApiResponse";
import { AdvisorCache } from "@/lib/advisor/cache";
import { recommendTravelCardAdvanced } from "@/lib/logic/advisor/engine";
import { travelRecommendInputSchema } from "@/schemas/advisor";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return ApiResponse.error("Invalid JSON body", 400);
  }

  const parsed = travelRecommendInputSchema.safeParse(body);
  if (!parsed.success) {
    return ApiResponse.error(
      parsed.error.issues[0]?.message ?? "Invalid input",
      400,
    );
  }

  try {
    await AdvisorCache.ensureFresh();
    const result = recommendTravelCardAdvanced(
      parsed.data,
      AdvisorCache.cards(),
      AdvisorCache.bestOf(),
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
    console.error("[/api/recommend/travel] failed:", err);
    return ApiResponse.error("Recommendation failed", 500);
  }
}
