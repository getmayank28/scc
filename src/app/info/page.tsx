import { MultiStepForm } from "@/components/MultiStepForm";
import React from "react";


const page = () => {
  return (
    <div className="relative h-screen max-md:h-auto max-md:px-0 px-10 items-center justify-center gap-8 pb-[200px] max-md:pb-[50px] lg:gap-16 font-sans">
      <div className="aboslute top-0">
        <div className="relative h-[300px] max-md:h-[200px] overflow-hidden w-full flex justify-center items-center">
          <div
            className="w-[1600px] absolute h-[1600px] bottom-[00px] transform -translate-x-1/2 left-[50%] rounded-full"
            style={{
              background:
                "linear-gradient(180deg,#F35A13 0%, rgba(16, 16, 16, 1) 100%)",
            }}
          ></div>
        </div>
      </div>

      <div className="max-w-[984px] mx-auto text-center -mt-[125px] z-10 relative">
        <h1 className="text-[#FFF] text-center font-butlerpro text-[80px] font-medium leading-[110%] tracking-[-6px] max-md:text-[56px] max-md:tracking-[-0.4px]">
          Find your perfect <br className="max-md:hidden" />
          <span className="max-md:hidden">credit</span> card
        </h1>
        <p className="text-white opacity-70 text-center font-satoshi max-md:mt-1 text-[20px] max-md:text-[16px] font-normal leading-[150%] tracking-[-2%] max-md:tracking-[-0.48px] [font-feature-settings:'ss03_on']">
          Get personalized card recommendations
          <br className="hidden max-md:block" />
          <br className="max-md:hidden" />
          <span className="max-md:hidden">
            Discover the best rewards, cashback, and benefits for you.
          </span>
        </p>
      </div>
      <MultiStepForm />
    </div>
  );
};

export default page;
