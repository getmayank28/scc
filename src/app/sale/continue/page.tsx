import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { ROUTES } from "@/lib/constants/routes";

/**
 * Post-sign-in router for the sale funnel. Every sale-page CTA that leads into
 * sign-in sends the visitor here afterwards (via `?callbackUrl=/sale/continue`).
 * Signed-in users go straight to the Spend Optimizer — there is no onboarding
 * step any more. Not authenticated yet → bounce back into sign-in, preserving
 * the intent so we return here once they're in.
 */
export const dynamic = "force-dynamic";

export default async function SaleContinue() {
  const session = await getServerSession(authOptions);

  if (!session?.user?._id) {
    redirect(`${ROUTES.SIGN_IN}?callbackUrl=${encodeURIComponent("/sale/continue")}`);
  }

  redirect(ROUTES.SPEND_OPTIMIZER);
}
