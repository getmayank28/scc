import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/options";
import { ApiResponse } from "@/lib/utils/ApiResponse";
import { readStoredDetail } from "@/lib/unipile/storedReads";

export const runtime = "nodejs";

// Full email detail, served from OUR DB. The body was collapsed to text and
// stored at sync time, so this never calls Unipile — it works after the trial
// expires. Scoped by userId, so a user can only read their own synced mail.
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?._id;
  if (!userId) return ApiResponse.error("Unauthorized", 401);

  const url = new URL(req.url);
  const providerId = url.searchParams.get("provider_id") ?? "";
  if (!providerId) {
    return ApiResponse.error("provider_id is required", 400);
  }

  const detail = await readStoredDetail({ userId, providerId });
  if (!detail) {
    // Not in the cache — either never synced, or belongs to another user.
    return ApiResponse.error("Email not found in cache", 404);
  }

  return ApiResponse.success("ok", 200, detail);
}
