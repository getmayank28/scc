import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/options";
import dbConnect from "@/lib/utils/dbConnet";
import { ApiResponse } from "@/lib/utils/ApiResponse";
import { isAdmin } from "@/lib/constants/admin";
import { buildHealthReport, toItem } from "@/lib/affiliate/healthReport";
import { checkKey } from "@/lib/affiliate/health";
import { loadCampaignIndex } from "@/lib/affiliate/reasons";

/**
 * GET  /api/admin/affiliate/health          — link health overview
 * POST /api/admin/affiliate/health {key}    — re-check one target now ("card:<slug>")
 * Admin only.
 */
export const runtime = "nodejs";

// Card slugs include "/", "&", "+" and "–", so match the id loosely; it's only a lookup key.
const KEY_RE = /^(card|portal|voucher):\S{1,200}$/u;

async function guard() {
  const session = await getServerSession(authOptions);
  return isAdmin(session?.user?.phoneNumber);
}

export async function GET() {
  if (!(await guard())) return ApiResponse.error("Forbidden", 403);
  try {
    await dbConnect();
    return ApiResponse.success("ok", 200, await buildHealthReport());
  } catch (err) {
    console.error("[/api/admin/affiliate/health] failed", err);
    return ApiResponse.error("Health report failed", 500);
  }
}

export async function POST(req: Request) {
  if (!(await guard())) return ApiResponse.error("Forbidden", 403);
  let key: unknown;
  try {
    key = ((await req.json()) as { key?: unknown }).key;
  } catch {
    return ApiResponse.error("Invalid JSON body", 400);
  }
  if (typeof key !== "string" || !KEY_RE.test(key)) return ApiResponse.error("Invalid key", 400);

  try {
    await dbConnect();
    const row = await checkKey(key);
    if (!row) return ApiResponse.error("Unknown target", 404);
    return ApiResponse.success("checked", 200, toItem(row, new Map(), await loadCampaignIndex()));
  } catch (err) {
    console.error("[/api/admin/affiliate/health] check failed", err);
    return ApiResponse.error("Check failed", 500);
  }
}
