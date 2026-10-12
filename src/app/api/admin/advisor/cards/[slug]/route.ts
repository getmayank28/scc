import { ApiResponse } from "@/lib/utils/ApiResponse";
import { requireAdmin } from "@/lib/advisor/adminAuth";
import dbConnect from "@/lib/utils/dbConnet";
import CardAdvisorModel from "@/models/Card";
import CardRuleModel from "@/models/CardRule";
import CardBestOfModel from "@/models/CardBestOf";
import { cardUpdateSchema } from "@/schemas/advisorAdmin";
import { AdvisorCache } from "@/lib/advisor/cache";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, ctx: RouteContext) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { slug } = await ctx.params;

  try {
    await dbConnect();
    const card = await CardAdvisorModel.findOne({ slug }).lean();
    if (!card) return ApiResponse.error("Card not found", 404);
    return ApiResponse.success("ok", 200, card);
  } catch (err) {
    console.error("[admin/cards/:key GET] failed:", err);
    return ApiResponse.error("Failed to fetch card", 500);
  }
}

// PUT — partial update. Bumps rulesVersion when any field is touched so
// downstream bestOf cache entries are treated as stale on next read.
export async function PUT(req: Request, ctx: RouteContext) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { slug } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return ApiResponse.error("Invalid JSON body", 400);
  }

  const parsed = cardUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return ApiResponse.error(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  try {
    await dbConnect();
    const updated = await CardAdvisorModel.findOneAndUpdate(
      { slug },
      { $set: parsed.data, $inc: { rulesVersion: 1 } },
      { new: true, runValidators: true },
    );
    if (!updated) return ApiResponse.error("Card not found", 404);
    AdvisorCache.invalidate();
    return ApiResponse.success("updated", 200, updated);
  } catch (err) {
    console.error("[admin/cards/:key PUT] failed:", err);
    return ApiResponse.error("Failed to update card", 500);
  }
}

// DELETE — removes the card plus its rules and bestOf cache rows. Cascade is
// synchronous since admin traffic is low and we don't want orphans lying around.
export async function DELETE(_req: Request, ctx: RouteContext) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { slug } = await ctx.params;

  try {
    await dbConnect();
    const card = await CardAdvisorModel.findOneAndDelete({ slug });
    if (!card) return ApiResponse.error("Card not found", 404);
    await Promise.all([
      CardRuleModel.deleteMany({ cardSlug: slug }),
      CardBestOfModel.deleteMany({ cardSlug: slug }),
    ]);
    AdvisorCache.invalidate();
    return ApiResponse.success("deleted", 200);
  } catch (err) {
    console.error("[admin/cards/:key DELETE] failed:", err);
    return ApiResponse.error("Failed to delete card", 500);
  }
}
