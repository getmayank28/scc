"use client"
import { Button } from "@/components/ui/stateful-button";
import { trackEvent } from "@/lib/analytics/track";
import { EventName } from "@/lib/analytics/types";
import useLandingCTAs from "@/lib/hooks/useLandingCTAs";

const LandingCTA = ({ title, eventButtonName }: { title: string, eventButtonName: string }) => {
  const landingCTA = useLandingCTAs()
  return (
    <Button
      className="text-sm font-bold py-4 px-10 my-10"
      onClick={() => {
        trackEvent(EventName.BUTTON_CLICKED, {
          buttonName: eventButtonName,
          location: EventName.LANDING_PAGE,
        });
        landingCTA?.()
      }}
    >
      {title}
    </Button>
  )
}

export default LandingCTA