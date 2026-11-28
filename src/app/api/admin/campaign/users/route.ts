import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/options";
import dbConnect from "@/lib/utils/dbConnet";
import { ApiResponse } from "@/lib/utils/ApiResponse";
import { isAdmin } from "@/lib/constants/admin";
import { festiveUsers } from "@/lib/campaign/users";
import type { CampaignRange } from "@/types/rewards";

/**
 * GET /api/admin/campaign/users?range=7d|30d|90d|all — users who came through
 * the festive page, with phone, name, employment and salary range. Admin only.
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
    return ApiResponse.success("ok", 200, await festiveUsers(range));
  } catch (err) {
    console.error("[/api/admin/campaign/users] failed", err);
    return ApiResponse.error("Users failed", 500);
  }
}
