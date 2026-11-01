import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/options";
import dbConnect from "@/lib/utils/dbConnet";
import { ApiResponse } from "@/lib/utils/ApiResponse";
import { isAdmin } from "@/lib/constants/admin";
import { claimsByPhone } from "@/lib/campaign/report";

/**
 * GET /api/admin/campaign/claims?phone=98xxxxxxxx — a user's claims, each with
 * its full timeline (click → Cuelinks statuses → issue → reveal → WhatsApp).
 * Admin only; never returns voucher codes.
 */
export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.phoneNumber)) return ApiResponse.error("Forbidden", 403);

  const phone = new URL(req.url).searchParams.get("phone") ?? "";
  if (phone.replace(/\D/g, "").length < 10) return ApiResponse.error("Enter a 10-digit phone number", 400);

  try {
    await dbConnect();
    return ApiResponse.success("ok", 200, await claimsByPhone(phone));
  } catch (err) {
    console.error("[/api/admin/campaign/claims] failed", err);
    return ApiResponse.error("Lookup failed", 500);
  }
}
