import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import dbConnect from "@/lib/utils/dbConnet";
import { ApiResponse } from "@/lib/utils/ApiResponse";
import { rewardsFor } from "@/lib/campaign/vouchers";

/**
 * GET /api/rewards/claims — the signed-in user's campaign claims for
 * My rewards, newest first. Never includes voucher codes; those come only from
 * POST /api/rewards/claims/:id/reveal.
 */
export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?._id;
  if (!userId) return ApiResponse.error("Unauthorized", 401);

  try {
    await dbConnect();
    return ApiResponse.success("ok", 200, await rewardsFor(userId));
  } catch (err) {
    console.error("[/api/rewards/claims] failed", err);
    return ApiResponse.error("Couldn't load rewards", 500);
  }
}
