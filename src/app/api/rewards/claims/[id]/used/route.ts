import { getServerSession } from "next-auth";
import { Types } from "mongoose";
import { authOptions } from "../../../../auth/[...nextauth]/options";
import dbConnect from "@/lib/utils/dbConnet";
import { ApiResponse } from "@/lib/utils/ApiResponse";
import { setVoucherUsed } from "@/lib/campaign/vouchers";

/**
 * POST /api/rewards/claims/:id/used — { used: boolean }. The owner marks an
 * issued voucher used (or undoes it). We can't see redemption at the brand,
 * so this only decides which group My rewards shows it in.
 */
export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?._id;
  if (!userId) return ApiResponse.error("Unauthorized", 401);

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) return ApiResponse.error("Voucher not found", 404);

  let used = true;
  try {
    used = (await req.json())?.used !== false;
  } catch {
    // no body = mark used
  }

  try {
    await dbConnect();
    if (!(await setVoucherUsed(id, userId, used))) return ApiResponse.error("Voucher not found", 404);
    return ApiResponse.success(used ? "Marked as used" : "Marked as not used");
  } catch (err) {
    console.error("[/api/rewards/claims/used] failed", err);
    return ApiResponse.error("Couldn't update the voucher", 500);
  }
}
