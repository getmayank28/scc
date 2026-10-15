import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { ApiResponse } from "@/lib/utils/ApiResponse";
import { adminPhonesConfigured, isAdmin } from "@/lib/constants/admin";

// Admin gate for advisor endpoints. Allowed numbers come from the ADMIN_PHONES
// env var (see lib/constants/admin). No DB role table — kept minimal because
// admin access is expected to remain a handful of internal numbers.
//
// Usage in a route:
//   const denied = await requireAdmin();
//   if (denied) return denied;
//   ... handler logic ...

export async function requireAdmin(): Promise<Response | null> {
  const session = await getServerSession(authOptions);
  const phoneNumber = session?.user?.phoneNumber;
  if (!phoneNumber) return ApiResponse.error("Unauthorized", 401);

  if (!adminPhonesConfigured()) {
    console.warn("[adminAuth] ADMIN_PHONES env not set — all admin routes are blocked");
    return ApiResponse.error("Admin access not configured", 403);
  }
  if (!isAdmin(phoneNumber)) return ApiResponse.error("Forbidden", 403);

  return null;
}
