import { ApiResponse } from "@/lib/utils/ApiResponse";
import { buildInsights } from "@/lib/insights/insightEngine";
import {
  getWallet,
  getLedger,
  getEntitlements,
  verifyLedger,
} from "@/lib/insights/mockLedger";

export const runtime = "nodejs";
// Insights are computed from a pinned demo clock plus live card data; caching a
// response would freeze the countdowns partway through a demo.
export const dynamic = "force-dynamic";

/**
 * The card-intelligence feed: milestone progress, reward-cap utilisation,
 * fee-waiver races and expiring benefits, merged into one ranked list.
 *
 * Card data (fees, milestones, caps, names) is read live from the advisor
 * catalogue. The spend ledger and benefit entitlements are simulated until
 * email/statement access lands — see `src/lib/insights/mockLedger.ts`, which is
 * the single file to delete at that point.
 *
 * GET /api/insights
 *   → { insights: Insight[], totalAtRiskInr, cards, warnings, generatedAt }
 */
export async function GET() {
  try {
    // Guardrail: surfaces a broken demo narrative in the payload rather than
    // letting it silently flatten on stage.
    const warnings = verifyLedger();

    const result = await buildInsights(
      getWallet(),
      getLedger(),
      getEntitlements(),
      warnings,
    );

    return ApiResponse.success("Insights computed", 200, result);
  } catch (err) {
    console.error("[api/insights] failed", err);
    return ApiResponse.error("Failed to compute insights", 500);
  }
}
