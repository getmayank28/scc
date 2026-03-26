"use client"
import { useFeatureFlag } from "@/contexts/FeatureContext";
import Waitlist from "./Waitlist"
import WeDonNotPromote from "./WeDonNotPromote"
import { FeatureFlagsConfig } from "@/lib/constants/featureFlags";
import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics/track";
import { EventName } from "@/lib/analytics/types";

const RenderWaitlist = () => {
    const isWaitlistEnabled = useFeatureFlag(FeatureFlagsConfig.WAITLIST);


  useEffect(() => {
    trackEvent(EventName.LANDING_PAGE, {
      path: window.location.pathname,
      referrer: document.referrer,
    });
  }, []);

    if (!isWaitlistEnabled) return <></>

    return (
        <>
            <Waitlist />
            <WeDonNotPromote />
        </>
    )
}

export default RenderWaitlist