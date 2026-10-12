import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { ApiResponse } from "@/lib/utils/ApiResponse";

// Admin gate for advisor endpoints. Allowed emails come from the ADMIN_EMAILS
// env var (comma-separated). No DB role table — kept minimal because admin
// access is expected to remain a handful of internal emails.
//
// Usage in a route:
//   const denied = await requireAdmin();
//   if (denied) return denied;
//   ... handler logic ...

function parseAllowedEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

export async function requireAdmin(): Promise<Response | null> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();
  if (!email) return ApiResponse.error("Unauthorized", 401);

  const allowed = parseAllowedEmails();
  if (allowed.size === 0) {
    console.warn("[adminAuth] ADMIN_EMAILS env not set — all admin routes are blocked");
    return ApiResponse.error("Admin access not configured", 403);
  }
  if (!allowed.has(email)) return ApiResponse.error("Forbidden", 403);

  return null;
}
