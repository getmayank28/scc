"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { identifyUser, initAmplitude, resetAmplitude } from "@/lib/analytics/amplitude";
import { captureAttribution } from "@/lib/analytics/attribution";

const AnalyticsIdentifier = () => {
  const { data: session, status } = useSession();
  const userId = session?.user?._id;

  // Immediately, not on idle: the landing URL's UTMs/fbclid must be stored
  // before the visitor can navigate away from it.
  useEffect(() => {
    captureAttribution();
  }, []);

  useEffect(() => {
    const run = () => {
      initAmplitude();

      if (status === "authenticated" && userId) {
        identifyUser({
          id: userId,
          email: session?.user?.email,
          username: session?.user?.username,
        });
      } else if (status === "unauthenticated") {
        resetAmplitude();
      }
    };

    if (typeof window === "undefined") return;

    if (typeof window.requestIdleCallback === "function") {
      const handle = window.requestIdleCallback(run);
      return () => window.cancelIdleCallback(handle);
    }

    const handle = window.setTimeout(run, 2000);
    return () => window.clearTimeout(handle);
  }, [status, userId, session?.user?.email, session?.user?.username]);

  return null;
};

export default AnalyticsIdentifier;
