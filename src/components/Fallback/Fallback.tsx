"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/libs/constants/routes";

const Fallback = () => {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          router.replace(ROUTES.CARD_FORM);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="relative h-screen px-10 items-center justify-center gap-8 pb-[200px] lg:gap-16 font-sans">
      <div className="aboslute top-0">
        <div className="relative h-[270px] overflow-hidden w-full flex justify-center items-center">
          <div
            className="w-[1600px] absolute h-[1600px] bottom-[00px] transform -translate-x-1/2 left-[50%] rounded-full"
            style={{
              background:
                "linear-gradient(180deg,#F35A13 0%, rgba(16, 16, 16, 1) 100%)",
            }}
          ></div>
        </div>
      </div>
      <div className="text-center p-8 -mt-[180px]">
        <div className="max-w-[984px] mx-auto text-center">
          <h1 className="text-[#FFF] capitalize text-center font-butlerpro relative !z-[20] text-[80px] font-medium leading-[110%] tracking-[-6px] max-md:text-[56px] max-md:tracking-[-4%]">
            Info required
          </h1>
          <p className="text-white -mt-0 uppercase opacity-70 text-center font-satoshi max-md:mt-1 text-[16px] font-normal leading-[150%] tracking-[-2%] max-md:tracking-[-0.48px] [font-feature-settings:'ss03_on']">
            Please fill the form first to get the card
          </p>
        </div>

        <div className="mb-6 mt-10 flex flex-col gap-2">
          <p className="text-white mt-5 opacity-70 text-center font-satoshi max-md:mt-1 text-[20px] font-normal leading-[150%] tracking-[-2%] max-md:tracking-[-0.48px] [font-feature-settings:'ss03_on']">
            Returning to form in
          </p>
          <p className="text-[80px] font-bold -mt-5 text-[rgba(118,41,243,1)]">
            {countdown}s
          </p>
        </div>

        <button
          onClick={() => router.replace(ROUTES.CARD_FORM)}
          className="cursor-pointer w-[260px] mx-auto mt-8 flex gap-2 items-center justify-center text-black bg-white py-4 px-8 rounded-full transition-all duration-300 ease-in-out hover:scale-105 active:scale-95"
        >
          <p className="font-bold text-[16px] tarcking-[-0.03em]">
            Go to Form Now
          </p>
          <p className="font-bold">→</p>
        </button>
      </div>
    </div>
  );
};

export default Fallback;
