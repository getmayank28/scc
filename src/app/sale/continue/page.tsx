import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { ROUTES } from "@/lib/constants/routes";

/**
 * Post-sign-in router for the sale funnel. Every sale-page CTA that leads into
 * sign-in sends the visitor here afterwards (via `?callbackUrl=/sale/continue`).
 * Because everything under `/sale` is public in middleware, this route escapes
 * the global user-info gate and can pick the destination itself:
 *   • existing (onboarded) users → Spend Optimizer
 *   • new users (no profile yet) → Profile
 * Not authenticated yet → bounce back into sign-in, preserving the intent so we
 * return here once they're in.
 */
export const dynamic = "force-dynamic";

export default async function SaleContinue() {
  const session = await getServerSession(authOptions);

  if (!session?.user?._id) {
    redirect(`${ROUTES.SIGN_IN}?callbackUrl=${encodeURIComponent("/sale/continue")}`);
  }

  if (session.user.hasCompletedUserInfo) {
    // Existing, onboarded user → straight to the optimizer.
    redirect(ROUTES.SPEND_OPTIMIZER);
  }

  // New user: the app requires profile/user-info completion before any app
  // route is reachable, so send them there directly and hand off to the profile
  // section once they're done (instead of the default /home).
  redirect(`${ROUTES.USER_INFO}?callbackUrl=${encodeURIComponent(ROUTES.PROFILE)}`);
}
