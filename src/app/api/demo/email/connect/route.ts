import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/options";
import { ApiResponse } from "@/lib/utils/ApiResponse";
import { createHostedAuthLink, UnipileError } from "@/lib/unipile/client";

export const runtime = "nodejs";

export async function POST() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?._id;
  if (!userId) return ApiResponse.error("Unauthorized", 401);

  // Unipile needs publicly reachable URLs. Locally this means a tunnel
  // (ngrok/cloudflared) — localhost will not receive the notify callback.
  const appUrl = process.env.NEXTAUTH_URL;
  if (!appUrl) return ApiResponse.error("NEXTAUTH_URL is not set", 500);

  try {
    const link = await createHostedAuthLink({
      name: userId,
      successRedirectUrl: `${appUrl}/demo/email?connected=1`,
      failureRedirectUrl: `${appUrl}/demo/email?connected=0`,
      notifyUrl: `${appUrl}/api/demo/email/callback${
        process.env.UNIPILE_WEBHOOK_SECRET
          ? `?secret=${encodeURIComponent(process.env.UNIPILE_WEBHOOK_SECRET)}`
          : ""
      }`,
    });

    return ApiResponse.success("ok", 200, { url: link.url });
  } catch (err) {
    const status = err instanceof UnipileError ? err.status : 500;
    console.error("[/api/demo/email/connect] failed:", err);
    return ApiResponse.error(
      err instanceof UnipileError ? err.message : "Could not create auth link",
      status >= 400 && status < 600 ? status : 500,
    );
  }
}
