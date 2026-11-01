import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import dbConnect from "@/lib/utils/dbConnet";
import { ApiResponse } from "@/lib/utils/ApiResponse";
import { isAdmin } from "@/lib/constants/admin";
import { buildCampaignReport } from "@/lib/campaign/report";
import type { CampaignRange } from "@/types/rewards";

/**
 * GET /api/admin/campaign?range=7d|30d|90d|all — festive campaign funnel,
 * voucher queue, review lists, money and health. Admin only.
 */
export const runtime = "nodejs";

const RANGES: CampaignRange[] = ["7d", "30d", "90d", "all"];

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.phoneNumber)) return ApiResponse.error("Forbidden", 403);

  const range = (new URL(req.url).searchParams.get("range") ?? "30d") as CampaignRange;
  if (!RANGES.includes(range)) return ApiResponse.error("range must be 7d, 30d, 90d or all", 400);

  try {
    await dbConnect();
    return ApiResponse.success("ok", 200, await buildCampaignReport(range));
  } catch (err) {
    console.error("[/api/admin/campaign] failed", err);
    return ApiResponse.error("Report failed", 500);
  }
}
