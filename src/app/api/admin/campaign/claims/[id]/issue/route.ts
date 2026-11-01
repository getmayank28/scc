import { getServerSession } from "next-auth";
import { Types } from "mongoose";
import { authOptions } from "../../../../../auth/[...nextauth]/options";
import dbConnect from "@/lib/utils/dbConnet";
import { ApiResponse } from "@/lib/utils/ApiResponse";
import { isAdmin } from "@/lib/constants/admin";
import { issueVoucher } from "@/lib/campaign/vouchers";
import { voucherKeyConfigured } from "@/lib/crypto/voucher";

/**
 * POST /api/admin/campaign/claims/:id/issue — { brand, code, pin?, expiry? }.
 * Moves an approved claim to issued, stores the code encrypted, and tells the
 * user on WhatsApp (without the code). Admin only.
 */
export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const adminPhone = session?.user?.phoneNumber;
  if (!isAdmin(adminPhone)) return ApiResponse.error("Forbidden", 403);

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) return ApiResponse.error("Claim not found", 404);
  if (!voucherKeyConfigured()) return ApiResponse.error("VOUCHER_ENC_KEY is not configured", 503);

  let body: { brand?: string; code?: string; pin?: string | null; expiry?: string | null };
  try {
    body = await req.json();
  } catch {
    return ApiResponse.error("Invalid JSON", 400);
  }

  try {
    await dbConnect();
    const result = await issueVoucher(
      id,
      { brand: body.brand ?? "", code: body.code ?? "", pin: body.pin, expiry: body.expiry },
      adminPhone!,
    );
    if (!result.ok) return ApiResponse.error(result.error, result.status);
    return ApiResponse.success("Voucher issued");
  } catch (err) {
    console.error("[/api/admin/campaign/issue] failed", err);
    return ApiResponse.error("Couldn't issue the voucher", 500);
  }
}
