"use Cleint";
import Typography from "@/components/Typography/Typography";
import AnimatedCircles from "./CircleAnimation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/stateful-button";

const YourSpendings = () => {
  const [isAnimated, setIsAnimated] = useState(false);
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



  const handleClick = () => {
    setIsAnimated(prev => !prev)

    };
  return (
    <>
      <div className="flex h-screen bg-background-primary gap-30 overflow-hidden items-center justify-center relative z-10">
        {/* LEFT CONTENT */}
        <div className="flex flex-col justify-start items-start z-10">
          <div className="max-w-[984px] mx-auto text-center">
            <Typography className="font-butlerpro font-medium text-left leading-24">
              Where your <br/> money goes
            </Typography>
            <Typography variant="body" className="text-left opacity-90">
            You spend on lifestyle and enjoying great trips. <br/>  But  re&apos;you getting the best offers on your card?
            </Typography>
          </div>

          <div>
            <Button
              className="text-sm font-bold py-4 px-10 my-10"
              onClick={handleClick}
            >
              step1
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
