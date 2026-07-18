import { ApiResponse } from "@/lib/utils/ApiResponse";
import { requireAdmin } from "@/lib/advisor/adminAuth";
import dbConnect from "@/lib/utils/dbConnet";
import CardAdvisorModel from "@/models/Card";
import { recomputeBestOfForCard } from "@/lib/advisor/recompute";
import { AdvisorCache } from "@/lib/advisor/cache";

export const runtime = "nodejs";

// Force rebuild of the bestOf cache. Used when rule data was changed out-of-band
// (e.g. direct Atlas edits or seed re-runs) and we need the precomputed payload
// to catch up without waiting for the next admin write.
//
// Query params:
//   ?slug=<slug>        recompute one card only
//   (no params)         recompute every active card (slow on large datasets)
export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    // `advisorKey` kept as a fallback for older callers; slug is the canonical id.
    const slug =
      searchParams.get("slug") ?? searchParams.get("advisorKey");

    if (slug) {
      const { written } = await recomputeBestOfForCard(slug);
      AdvisorCache.invalidate();
      return ApiResponse.success("ok", 200, { slug, written });
    }

    const cards = await CardAdvisorModel.find({})
      .select("slug")
      .lean();
    let totalWritten = 0;
    for (const c of cards) {
      if (!c.slug) continue;
      const { written } = await recomputeBestOfForCard(c.slug);
      totalWritten += written;
    }
    AdvisorCache.invalidate();
    return ApiResponse.success("ok", 200, {
      cards: cards.length,
      totalWritten,
    });
  } catch (err) {
    console.error("[admin/recompute POST] failed:", err);
    return ApiResponse.error("Recompute failed", 500);
  }
}
