"use client";
import Typography from "@/components/Typography/Typography";
import { Button } from "@/components/ui/stateful-button";
import { useWaitlistControl } from "@/contexts/WaitlistContext";
import { trackEvent } from "@/lib/analytics/track";
import { EventName } from "@/lib/analytics/types";

const EarlyAccessInput = () => {
  const { openWaitlistModal } = useWaitlistControl();

  return (
    <div
      onClick={() => {
        trackEvent(EventName.BUTTON_CLICKED, {
          buttonName: EventName.WAITLIST_GET_EARLY_ACCESS_BTN,
          location: EventName.LANDING_PAGE,
        });
        openWaitlistModal?.();
      }}
      className="max-md:w-full mt-10 h-14 pr-2 pl-5 flex justify-between items-center max-w-md rounded-full border border-primary-orange"
    >
      <Typography variant="body" className="text-[16px] opacity-60">
        Enter your email
      </Typography>
      <Button className="text-sm font-bold" onClick={openWaitlistModal}>
        Get Early Access →
      </Button>
    </div>
  );
};

export default EarlyAccessInput;
