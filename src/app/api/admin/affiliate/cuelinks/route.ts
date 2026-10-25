import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/options";
import dbConnect from "@/lib/utils/dbConnet";
import { ApiResponse } from "@/lib/utils/ApiResponse";
import { isAdmin } from "@/lib/constants/admin";
import { buildCuelinksReport } from "@/lib/affiliate/cuelinksReport";
import type { ReportRange } from "@/types/affiliateReport";

/**
 * GET /api/admin/affiliate/cuelinks?range=7d|30d|90d — Cuelinks' own reports
 * (performance, campaigns, monthly earnings, unmonetized traffic) and the
 * reconciliation against our transactions. Separate from the funnel so slow
 * external calls never hold up our own numbers. Admin only.
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
    return ApiResponse.success("ok", 200, await buildCuelinksReport(range));
  } catch (err) {
    console.error("[/api/admin/affiliate/cuelinks] failed", err);
    return ApiResponse.error("Report failed", 500);
  }
}
