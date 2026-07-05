"use client";

import { useRouter } from "next/navigation";
import UserInfoModal from "@/components/UserInfoModal/UserInfoModal";
import { ROUTES } from "@/lib/constants/routes";

export default function UserInfoPage() {
  const router = useRouter();

  const handleSuccess = () => {
    // Honour a post-onboarding destination when one was passed in (the sale
    // funnel routes new users here with ?callbackUrl=/profile). Same-origin
    // relative paths only, to avoid an open-redirect; default stays /home.
    const callbackUrl = new URLSearchParams(window.location.search).get(
      "callbackUrl"
    );
    router.push(
      callbackUrl && callbackUrl.startsWith("/")
        ? callbackUrl
        : ROUTES.LOGGED_IN_HOME
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brown-background/90 backdrop-blur-sm px-4">
      <div
        className="w-full max-w-md rounded-2xl border border-brown-border bg-brown-sidebar p-6 shadow-2xl overflow-y-auto max-h-[90dvh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-info-title"
      >
        <UserInfoModal onSuccess={handleSuccess} />
      </div>
    </div>
  );
}
