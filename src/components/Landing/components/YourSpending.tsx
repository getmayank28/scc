"use Cleint";
import Typography from "@/components/Typography/Typography";
import AnimatedCircles from "./CircleAnimation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/stateful-button";
import useLandingCTAs from "@/lib/hooks/useLandingCTAs";
import { trackEvent } from "@/lib/analytics/track";
import { EventName } from "@/lib/analytics/types";

const YourSpendings = () => {
  const [isAnimated, setIsAnimated] = useState(false);
  const landingCTA = useLandingCTAs()
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsAnimated(true);
        }
      },
      { threshold: 0.3 } // 30% visible
    );

    if (ref.current) observer.observe(ref.current);

    return () => observer.disconnect();
  }, []);


  return (
    <>
      <div className="flex h-screen max-md:mb-10 max-md:h-auto max-md:flex-col-reverse max-md:gap-10 bg-background-primary gap-30 overflow-hidden items-center justify-center relative z-10">
        {/* LEFT CONTENT */}
        <div className="flex flex-col max-md:items-center justify-start items-start z-10">
          <div className="max-w-[984px] mx-auto text-center">
            <Typography className="font-butlerpro font-medium text-left leading-24">
            Use right card, <br/> every time
            </Typography>
            <Typography variant="body" className="text-left opacity-90 max-md:text-center">
            FiSense Spend Optimizer analyzes your spending  and <br/>tells you the best credit card for every transaction  to <br/>maximize rewards, cashback, and points.            </Typography>
          </div>

          <div>
            <Button
              className="text-sm font-bold py-4 px-10 my-10"
              onClick={() => {
                trackEvent(EventName.BUTTON_CLICKED, {
                  buttonName: EventName.CHECK_MY_CARD_NOW_BTN,
                  location: EventName.LANDING_PAGE,
                });
                landingCTA?.()
              }}
            >
              Check my card now
            </Button>
          </div>
        </div>

        {/* RIGHT CONTENT */}
        <div  ref={ref} className="relative top-10">
          <AnimatedCircles isAnimated={isAnimated} />
        </div>
      </div>
    </>
  );
};

export default YourSpendings;
