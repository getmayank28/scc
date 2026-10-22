import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/options";
import dbConnect from "@/lib/utils/dbConnet";
import { ApiResponse } from "@/lib/utils/ApiResponse";
import { isAdmin } from "@/lib/constants/admin";
import { buildFunnelReport } from "@/lib/affiliate/report";
import type { ReportRange } from "@/types/affiliateReport";

/**
 * GET /api/admin/affiliate/report?range=7d|30d|90d — our funnel: clicks and
 * conversions by day, surface, card and merchant, plus unearned clicks and the
 * Cuelinks campaigns that need an access request. Admin only (commission data).
 */
export const runtime = "nodejs";

const RANGES: ReportRange[] = ["7d", "30d", "90d"];

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.phoneNumber)) return ApiResponse.error("Forbidden", 403);

  const range = (new URL(req.url).searchParams.get("range") ?? "30d") as ReportRange;
  if (!RANGES.includes(range)) return ApiResponse.error("range must be 7d, 30d or 90d", 400);

  try {
    await dbConnect();
    return ApiResponse.success("ok", 200, await buildFunnelReport(range));
  } catch (err) {
    console.error("[/api/admin/affiliate/report] failed", err);
    return ApiResponse.error("Report failed", 500);
  }
}
