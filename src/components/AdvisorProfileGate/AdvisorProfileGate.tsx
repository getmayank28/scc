"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Modal } from "@/components/ui/modal";
import AdvisorProfileForm from "@/components/AdvisorProfileForm/AdvisorProfileForm";
import { ROUTES } from "@/lib/constants/routes";
import { trackEvent } from "@/lib/analytics/track";
import { EventName } from "@/lib/analytics/types";

// Asks a signed-in user for employment type + income the first time they open
// the AI Advisor; recommendations are filtered by income eligibility. Signed-out
// visitors are left alone — the engines treat a missing profile as "unknown".
export default function AdvisorProfileGate() {
  const { data: session, status } = useSession();
  const open = status === "authenticated" && session?.user?.hasAdvisorProfile === false;

  useEffect(() => {
    if (open) trackEvent(EventName.ADVISOR_PROFILE_PROMPT_SHOWN, {});
  }, [open]);

  return (
    // Above the chat sidebar (z-100), which would otherwise sit over the backdrop.
    <Modal
      open={open}
      overlayClassName="z-[110]"
      className="z-[110] max-w-md max-h-[90dvh] overflow-y-auto rounded-2xl border border-brown-border bg-brown-sidebar p-6"
    >
      <div className="flex flex-col gap-1 mb-2">
        <h2 className="text-lg font-semibold text-white">Two quick questions</h2>
        <p className="text-sm text-white/60">
          Card eligibility depends on your income, so we only suggest cards you can actually get.
        </p>
      </div>
      <AdvisorProfileForm source="advisor_gate" submitLabel="Continue" />
      <Link
        href={ROUTES.LOGGED_IN_HOME}
        className="text-center text-xs text-white/50 underline underline-offset-2 hover:text-white"
      >
        Not now, take me home
      </Link>
    </Modal>
  );
}
