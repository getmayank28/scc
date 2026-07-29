import { ApiResponse } from "@/lib/utils/ApiResponse";
import { requireAdmin } from "@/lib/advisor/adminAuth";
import dbConnect from "@/lib/utils/dbConnet";
import CardRuleModel from "@/models/CardRule";
import CardAdvisorModel from "@/models/Card";
import { ruleCreateSchema } from "@/schemas/advisorAdmin";
import { recomputeBestOfForCard } from "@/lib/advisor/recompute";
import { AdvisorCache } from "@/lib/advisor/cache";
import { capGroupConflictFor } from "@/lib/advisor/capGroupGuard";

export const runtime = "nodejs";

// GET — list rules. Optional ?cardSlug filter for the common case.
export async function GET(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const cardSlug = searchParams.get("cardSlug");
    const filter = cardSlug ? { cardSlug } : {};
    const rules = await CardRuleModel.find(filter).lean();
    return ApiResponse.success("ok", 200, rules);
  } catch (err) {
    console.error("[admin/rules GET] failed:", err);
    return ApiResponse.error("Failed to list rules", 500);
  }
}

// POST — create a rule, bump the owning card's rulesVersion, and trigger a
// synchronous recompute of that card's bestOf cache so reads see fresh data.
export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return ApiResponse.error("Invalid JSON body", 400);
  }

  const parsed = ruleCreateSchema.safeParse(body);
  if (!parsed.success) {
    return ApiResponse.error(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  try {
    await dbConnect();
    const cardExists = await CardAdvisorModel.exists({
      slug: parsed.data.cardSlug,
    });
    if (!cardExists) {
      return ApiResponse.error("cardSlug does not exist", 400);
    }
    const ruleExists = await CardRuleModel.exists({ ruleKey: parsed.data.ruleKey });
    if (ruleExists) return ApiResponse.error("ruleKey already exists", 409);

    const conflict = await capGroupConflictFor(
      parsed.data.cardSlug,
      parsed.data as unknown as Record<string, unknown>,
    );
    if (conflict) return ApiResponse.error(conflict, 400);

    // Zod widens enum-bearing fields (merchant, category) to `string`; the
    // Mongoose doc types use narrow unions. Cast at the boundary.
    const created = await CardRuleModel.create(
      parsed.data as Parameters<typeof CardRuleModel.create>[0],
    );
    await CardAdvisorModel.updateOne(
      { slug: parsed.data.cardSlug },
      { $inc: { rulesVersion: 1 } },
    );
    await recomputeBestOfForCard(parsed.data.cardSlug);
    AdvisorCache.invalidate();
    return ApiResponse.success("created", 201, created);
  } catch (err) {
    console.error("[admin/rules POST] failed:", err);
    return ApiResponse.error("Failed to create rule", 500);
  }
}
