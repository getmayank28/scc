import { ApiResponse } from "@/lib/utils/ApiResponse";
import { requireAdmin } from "@/lib/advisor/adminAuth";
import dbConnect from "@/lib/utils/dbConnet";
import CardAdvisorModel from "@/models/Card";
import CardBestOfModel from "@/models/CardBestOf";
import { recomputeBestOfForCard } from "@/lib/advisor/recompute";
import { AdvisorCache } from "@/lib/advisor/cache";

export const runtime = "nodejs";

// Force rebuild of the bestOf cache. Used when rule data was changed out-of-band
// (e.g. direct Atlas edits or seed re-runs) and we need the precomputed payload
// to catch up without waiting for the next admin write.
//
// Query params:
//   ?slug=<slug>        recompute one card only
//   ?fresh=true         wipe the ENTIRE CardBestOf collection first, then
//                       recompute every card from scratch (drops any orphan
//                       rows left by deleted cards). Ignored when ?slug is set.
//   (no params)         recompute every card in place (upsert; no wipe)
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

    const fresh = searchParams.get("fresh") === "true";
    let deleted = 0;
    if (fresh) {
      // Full rebuild: drop the whole collection so nothing stale survives, then
      // repopulate from the current cards + rules.
      const res = await CardBestOfModel.deleteMany({});
      deleted = res.deletedCount ?? 0;
    }

    const cards = await CardAdvisorModel.find({})
      .select("slug")
      .lean();
    let totalWritten = 0;
    let failed = 0;
    for (const c of cards) {
      if (!c.slug) continue;
      try {
        const { written } = await recomputeBestOfForCard(c.slug);
        totalWritten += written;
      } catch (err) {
        failed++;
        console.error(`[admin/recompute] ${c.slug} failed:`, err);
      }
    }
    AdvisorCache.invalidate();
    return ApiResponse.success("ok", 200, {
      fresh,
      deleted,
      cards: cards.length,
      totalWritten,
      failed,
    });
  } catch (err) {
    console.error("[admin/recompute POST] failed:", err);
    return ApiResponse.error("Recompute failed", 500);
  }
}
