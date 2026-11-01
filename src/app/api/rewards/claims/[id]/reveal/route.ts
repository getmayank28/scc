import { getServerSession } from "next-auth";
import { Types } from "mongoose";
import { authOptions } from "../../../../auth/[...nextauth]/options";
import dbConnect from "@/lib/utils/dbConnet";
import { ApiResponse } from "@/lib/utils/ApiResponse";
import { revealVoucher } from "@/lib/campaign/vouchers";

/**
 * POST /api/rewards/claims/:id/reveal — the only place a voucher code leaves
 * the server. Owner only; each reveal is counted and the first one timestamped.
 * POST (not GET) so the code is never cached or prefetched.
 */
export const runtime = "nodejs";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?._id;
  if (!userId) return ApiResponse.error("Unauthorized", 401);

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) return ApiResponse.error("Voucher not found", 404);

  try {
    await dbConnect();
    const result = await revealVoucher(id, userId);
    if (!result.ok) return ApiResponse.error(result.error, result.status);
    const res = ApiResponse.success("ok", 200, result.voucher);
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (err) {
    console.error("[/api/rewards/claims/reveal] failed", err);
    return ApiResponse.error("Couldn't open the voucher", 500);
  }
}
