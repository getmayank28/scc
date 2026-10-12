import { ApiResponse } from "@/lib/utils/ApiResponse";
import { AdvisorCache } from "@/lib/advisor/cache";
import {
  toMerchantSlug,
  toUiCategory,
} from "@/lib/logic/advisor/spendOptimizer";

export const runtime = "nodejs";

/**
 * Which categories a merchant has reward rules in.
 *
 * The spend optimizer scores against `(cardSlug, category)`, so a merchant query
 * still needs a category — but the user shouldn't have to supply it. About 63%
 * of merchants have rules in exactly one category (Ajio → online shopping), so
 * the client can infer it and hide the picker entirely. The rest genuinely span
 * categories (MakeMyTrip covers 7), and there the client should offer only these
 * options rather than the full list.
 *
 * GET /api/spend-optimizer/merchant-categories?merchant=Ajio
 *   → { merchant: "ajio", categories: ["online-shopping"], known: true }
 */
export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("merchant")?.trim();
  if (!raw) return ApiResponse.error("merchant is required", 400);
  if (raw.length > 120) return ApiResponse.error("merchant is too long", 400);

  const merchantSlug = toMerchantSlug(raw);
  if (!merchantSlug) return ApiResponse.error("merchant is required", 400);

  try {
    const engineCategories =
      await AdvisorCache.categoriesForMerchant(merchantSlug);

    // Keep only categories the UI can actually offer, preserving the UI's own
    // ordering so the options read consistently wherever they appear.
    const uiCategories = engineCategories
      .map(toUiCategory)
      .filter((c): c is string => c !== null);

    return ApiResponse.success("ok", 200, {
      merchant: merchantSlug,
      categories: [...new Set(uiCategories)],
      known: engineCategories.length > 0,
    });
  } catch (err) {
    console.error("[/api/spend-optimizer/merchant-categories] failed:", err);
    return ApiResponse.error("Lookup failed", 500);
  }
}
