"use client"
import { Button } from "@/components/ui/stateful-button";
import { useFeatureFlag } from "@/contexts/FeatureContext";
import { trackEvent } from "@/lib/analytics/track";
import { EventName } from "@/lib/analytics/types";
import { FeatureFlagsConfig } from "@/lib/constants/featureFlags";
import useLandingCTAs from "@/lib/hooks/useLandingCTAs";
import useNav from "@/lib/hooks/useNav";

const LandingCTA = ({ title, eventButtonName }: { title: string, eventButtonName: string }) => {
  const landingCTA = useLandingCTAs()
  const isWaitlistEnabled = useFeatureFlag(FeatureFlagsConfig.WAITLIST);
  const {goToSignInPushNav} = useNav()

  const handleClick = () => {
    trackEvent(EventName.BUTTON_CLICKED, {
      buttonName: eventButtonName,
      location: EventName.LANDING_PAGE,
    });
    if(isWaitlistEnabled){
      landingCTA?.()
    }else{
      goToSignInPushNav?.()
    }
  }

  return (
    <Button
      className="text-sm font-bold py-4 px-10 my-10"
      onClick={handleClick}
    >
      {title}
    </Button>
  )
}

export default LandingCTA