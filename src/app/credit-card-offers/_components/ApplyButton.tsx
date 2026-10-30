"use client";

import { useState } from "react";
import { getSession, useSession } from "next-auth/react";
import { ArrowUpRight, X } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import SignInSection from "@/components/SignInSection/SignInSection";
import { outUrl } from "@/lib/cuelinks/outUrl";
import { useAnalytics } from "@/lib/analytics/hooks/useAnalytics";
import { EventName } from "@/lib/analytics/types";

/**
 * Apply now: sign up (WhatsApp OTP) if needed, then straight to the bank via
 * `/api/out`, which logs the click against the user so the voucher can be paid.
 * A full-page navigation, not router.push, because `/api/out` 302s off-site.
 */
export function ApplyButton({
  slug,
  cardName,
  campaign,
}: {
  slug: string;
  cardName: string;
  campaign: string;
}) {
  const { status } = useSession();
  const { track } = useAnalytics();
  const [signingIn, setSigningIn] = useState(false);
  const href = outUrl({ type: "card", id: slug, surface: "campaign" });

  const goToBank = () => window.location.assign(href);

  const handleClick = async () => {
    // Don't block the button while the session loads — resolve it on tap instead.
    const signedIn =
      status === "authenticated" || (status === "loading" && Boolean(await getSession()));
    track(EventName.CAMPAIGN_APPLY_CLICKED, { campaign, cardSlug: slug, signedIn });
    if (signedIn) goToBank();
    else setSigningIn(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label={`Apply now for ${cardName}`}
        className="group/apply relative inline-flex h-[52px] w-full items-center justify-between gap-3 overflow-hidden rounded-full bg-[linear-gradient(135deg,#FF8A3D_0%,var(--primary-orange)_45%,#E5391B_100%)] pl-6 pr-1.5 font-satoshi text-[15px] font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_12px_28px_-10px_var(--primary-orange)] ring-1 ring-white/15 transition duration-300 hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_18px_40px_-12px_var(--primary-orange)] active:translate-y-0 active:scale-[0.98]"
      >
        {/* light sweep on hover */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 ease-out group-hover/apply:translate-x-[420%]"
        />
        <span className="relative">Apply now</span>
        <span className="relative flex size-10 items-center justify-center rounded-full bg-white text-primary-orange shadow-[0_2px_8px_rgba(0,0,0,0.2)] transition-transform duration-300 group-hover/apply:rotate-45">
          <ArrowUpRight className="size-[18px]" strokeWidth={2.5} aria-hidden />
        </span>
      </button>

      {signingIn && (
        <Modal
          open
          onChange={(open) => !open && setSigningIn(false)}
          className="w-auto max-w-none border-none bg-transparent p-0 shadow-none"
        >
          {/* SignInSection carries its own mobile side margin; centre it here instead. */}
          <div className="relative [&>div:last-child]:mx-0">
            <button
              type="button"
              onClick={() => setSigningIn(false)}
              aria-label="Close"
              className="absolute right-3 top-3 z-20 rounded-full border border-white p-1 text-white"
            >
              <X className="size-5" />
            </button>
            <SignInSection onSignedIn={goToBank} />
          </div>
        </Modal>
      )}
    </>
  );
}
