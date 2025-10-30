"use client";

import { LandingAnimation } from "@/components/LandingAnimation";
import { ActionButton } from "@/components/ui/action-button";
import { BackgroundRippleEffect } from "@/components/ui/background-ripple-effect";

const Hero = () => {
  return (
    <div className="flex bg-[#101010]  flex-col max-md:px-0 items-center justify-center pt-[220px] max-md:pt-[100px] max-md:pb-[0px] relative z-10">
      <BackgroundRippleEffect rows={18} />
      <div className="flex flex-col justify-center items-center">
        <div className="max-w-[984px] mx-auto text-center">
          <h1 className="text-[#FFF] text-center relative z-[100] font-butlerpro text-[80px] font-medium leading-[110%] tracking-[-6px] max-md:text-[56px] max-md:tracking-[-0.4px]">
            Find your perfect <br className="max-md:hidden" />
            <span className="max-md:hidden">credit</span> card
          </h1>
          <p className="text-white opacity-70 relative z-[100] text-center font-satoshi max-md:-mt-1 text-[20px] max-md:text-[16px] font-normal leading-[150%] tracking-[-2%] max-md:tracking-[-0.48px] [font-feature-settings:'ss03_on']">
            Get personalized card recommendations{" "}
            <br className="hidden max-md:block" />
            based on your spending. <br className="max-md:hidden" />
            <span className="max-md:hidden">
              Discover the best rewards, cashback, and benefits for you.
            </span>
          </p>
        </div>
        <ActionButton title="Find my card" />
      </div>
      <div className="relative overflow-hidden w-full  flex justify-center items-center mt-[70px]">
        <div className="w-[70%] relative my-10 -top-[60px] max-md:w-[300px] z-[101] h-[392px]">
          <LandingAnimation />
        </div>
        <div
          className="w-[1600px] z-[100] max-md:w-[1500px] max-md:h-[1500px] max-md:top-[50px] absolute h-[1800px] top-[100px] transform -translate-x-1/2 left-[50%] rounded-full"
          style={{
            background:
              "linear-gradient(1800deg,rgba(243, 90, 19, 0.7) 0%, rgba(16, 16, 16, 1) 100%)",
          }}
        ></div>
      </div>
    </div>
  );
};

export default Hero;
