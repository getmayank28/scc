import { ApiResponse } from "@/lib/utils/ApiResponse";
import { requireAdmin } from "@/lib/advisor/adminAuth";
import dbConnect from "@/lib/utils/dbConnet";
import CardRuleModel from "@/models/CardRule";
import CardAdvisorModel from "@/models/CardDoc";
import { ruleUpdateSchema } from "@/schemas/advisorAdmin";
import { recomputeBestOfForCard } from "@/lib/advisor/recompute";
import { AdvisorCache } from "@/lib/advisor/cache";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ ruleKey: string }> };

export async function GET(_req: Request, ctx: RouteContext) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { ruleKey } = await ctx.params;

  try {
    await dbConnect();
    const rule = await CardRuleModel.findOne({ ruleKey }).lean();
    if (!rule) return ApiResponse.error("Rule not found", 404);
    return ApiResponse.success("ok", 200, rule);
  } catch (err) {
    console.error("[admin/rules/:key GET] failed:", err);
    return ApiResponse.error("Failed to fetch rule", 500);
  }
}

// PUT — partial update. Re-runs bestOf recompute for whichever card now owns
// the rule (handles the edge case of changing cardAdvisorKey).
export async function PUT(req: Request, ctx: RouteContext) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { ruleKey } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return ApiResponse.error("Invalid JSON body", 400);
  }

  const parsed = ruleUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return ApiResponse.error(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  try {
    await dbConnect();
    const before = await CardRuleModel.findOne({ ruleKey }).lean();
    if (!before) return ApiResponse.error("Rule not found", 404);

    const updated = await CardRuleModel.findOneAndUpdate(
      { ruleKey },
      { $set: parsed.data },
      { new: true, runValidators: true },
    );
    if (!updated) return ApiResponse.error("Rule not found", 404);

    const affectedCards = new Set<string>();
    affectedCards.add(before.cardAdvisorKey);
    affectedCards.add(updated.cardAdvisorKey);

    for (const cardKey of affectedCards) {
      await CardAdvisorModel.updateOne(
        { advisorKey: cardKey },
        { $inc: { rulesVersion: 1 } },
      );
      await recomputeBestOfForCard(cardKey);
    }
    AdvisorCache.invalidate();
    return ApiResponse.success("updated", 200, updated);
  } catch (err) {
    console.error("[admin/rules/:key PUT] failed:", err);
    return ApiResponse.error("Failed to update rule", 500);
  }
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { ruleKey } = await ctx.params;

  try {
    await dbConnect();
    const deleted = await CardRuleModel.findOneAndDelete({ ruleKey });
    if (!deleted) return ApiResponse.error("Rule not found", 404);

    await CardAdvisorModel.updateOne(
      { advisorKey: deleted.cardAdvisorKey },
      { $inc: { rulesVersion: 1 } },
    );
    await recomputeBestOfForCard(deleted.cardAdvisorKey);
    AdvisorCache.invalidate();
    return ApiResponse.success("deleted", 200);
  } catch (err) {
    console.error("[admin/rules/:key DELETE] failed:", err);
    return ApiResponse.error("Failed to delete rule", 500);
  }
}
