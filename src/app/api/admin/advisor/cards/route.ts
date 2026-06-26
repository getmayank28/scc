import { ApiResponse } from "@/lib/utils/ApiResponse";
import { requireAdmin } from "@/lib/advisor/adminAuth";
import dbConnect from "@/lib/utils/dbConnet";
import CardAdvisorModel from "@/models/CardDoc";
import { cardCreateSchema } from "@/schemas/advisorAdmin";
import { AdvisorCache } from "@/lib/advisor/cache";

export const runtime = "nodejs";

// GET — list all advisor cards (admin-only).
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    await dbConnect();
    const cards = await CardAdvisorModel.find({}).lean();
    return ApiResponse.success("ok", 200, cards);
  } catch (err) {
    console.error("[admin/cards GET] failed:", err);
    return ApiResponse.error("Failed to list cards", 500);
  }
}

// POST — create a new advisor card. Caller must supply `advisorKey`; we don't
// auto-generate it because rules reference it as a stable string id.
export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return ApiResponse.error("Invalid JSON body", 400);
  }

  const parsed = cardCreateSchema.safeParse(body);
  if (!parsed.success) {
    return ApiResponse.error(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  try {
    await dbConnect();
    const existing = await CardAdvisorModel.findOne({
      advisorKey: parsed.data.advisorKey,
    }).lean();
    if (existing) {
      return ApiResponse.error("advisorKey already exists", 409);
    }
    const created = await CardAdvisorModel.create({
      ...parsed.data,
      rulesVersion: 1,
    });
    AdvisorCache.invalidate();
    return ApiResponse.success("created", 201, created);
  } catch (err) {
    console.error("[admin/cards POST] failed:", err);
    return ApiResponse.error("Failed to create card", 500);
  }
}
