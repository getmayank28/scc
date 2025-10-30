"use client";
import React, { useState, useRef, useEffect } from "react";
import Card from "./card";
import { camelCaseToWords, formatAmount } from "@/libs/utils";
import Fallback from "@/components/Fallback";

const CardsRecommendations = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  // Local divider component
  const divider = (
    <svg
      width="964"
      height="1"
      viewBox="0 0 964 1"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <line
        opacity="0.2"
        y1="0.5"
        x2="964"
        y2="0.5"
        stroke="url(#paint0_linear_5617_15403)"
      />
      <defs>
        <linearGradient
          id="paint0_linear_5617_15403"
          x1="0"
          y1="1.5"
          x2="964"
          y2="1.5"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="white" stop-opacity="0" />
          <stop offset="0.490385" stop-color="white" />
          <stop offset="1" stop-color="white" stop-opacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (textRef.current && isHovering) {
        const rect = textRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, [isHovering]);

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  const [cardData, setCardData] = useState<{
    cardExtraInfo: {
      loungeAccess: string[];
      addedBenefits: string[];
    };
    bestCard: {
      cardType: string;
      total: string | number;
    };
  } | null>(null);

  useEffect(() => {
    try {
      const storedData = localStorage.getItem("cardForYou");
      if (storedData) {
        const parsed = JSON.parse(storedData);
        setCardData(parsed);
      }
    } catch (error) {
      console.error("Failed to parse localStorage data:", error);
    }
  }, []);

  if (!cardData?.cardExtraInfo || !cardData?.bestCard) {
    return <Fallback />;
  }

  const { cardExtraInfo, bestCard } = cardData;

  const hideLounge =
    cardExtraInfo?.loungeAccess.length === 1 &&
    cardExtraInfo?.loungeAccess[0]?.toLowerCase() === "none";
  const hideAddedBenefits =
    cardExtraInfo?.addedBenefits.length === 1 &&
    cardExtraInfo?.addedBenefits[0]?.toLowerCase() === "none";
  const hideContainer = hideLounge && hideAddedBenefits;

  return (
    <div className="relative h-screen max-md:h-auto max-md:px-0 max-md:pb-[60px] px-10 items-center justify-center gap-8 pb-[200px] lg:gap-16 font-sans">
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
      <div className="absolute top-[80px] left-1/2 -translate-x-1/2">
        <div
          ref={textRef}
          className="relative text-6xl md:text-8xl font-bold leading-tight cursor-none"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Hidden text layer for layout */}
          <div className="text-transparent select-none">
            <Card color="rgba(255,255,255,0.05)" />
          </div>

          {/* Visible text layer with mask - only shows on hover */}
          <div
            className="absolute inset-0 text-white overflow-hidden"
            style={{
              maskImage: isHovering
                ? `radial-gradient(circle 120px at ${mousePosition.x}px ${mousePosition.y}px, black 100%, transparent 100%)`
                : "radial-gradient(circle 0px at 50% 50%, transparent 100%)",
              WebkitMaskImage: isHovering
                ? `radial-gradient(circle 120px at ${mousePosition.x}px ${mousePosition.y}px, black 100%, transparent 100%)`
                : "radial-gradient(circle 0px at 50% 50%, transparent 100%)",
            }}
          >
            <Card color="linear-gradient(120deg, #FC5179, #FB5117)" />
          </div>
        </div>
      </div>
      <div>
        <div className="max-w-[984px] mx-auto text-center mt-[100px] max-md:mt-[60px]">
          <h1 className="text-[#FFF] max-md:px-4 capitalize text-center font-butlerpro relative !z-[20] text-[80px] font-medium leading-[110%] tracking-[-6px] max-md:text-[56px] max-md:tracking-[-4%]">
            {camelCaseToWords(bestCard?.cardType || "")}
          </h1>
          <p className="text-white -mt-2 uppercase opacity-70 text-center font-satoshi max-md:-mt-2 text-[16px] font-normal leading-[150%] tracking-[-2%] max-md:tracking-[-0.48px] [font-feature-settings:'ss03_on']">
            the only card you need
          </p>
        </div>
        <div className="flex justify-center my-5">{divider}</div>
        <div className="flex max-md:flex-col max-md:items-center gap-6 justify-center">
          <div className="border-b-2 rounded-lg border-[#A9DFD8] bg-[rgba(169,223,216,0.22)] w-[180px] flex flex-col justify-center items-center py-3">
            <p className="text-[60px] font-bold -mt-5 text-[#A9DFD8]">
              {formatAmount(Number(bestCard?.total))}
            </p>
            <p className="text-[14px] uppercase -mt-4 text-[#A9DFD8] opacity-70 tracking-wider">
              Monthly benefits
            </p>
          </div>
          <div className="border-t-2 rounded-lg border-[#FCB859] bg-[rgba(252,184,89,0.22)] w-[180px] flex flex-col justify-center items-center py-3">
            <p className="text-[60px] font-bold -mt-5 text-[#FCB859]">
              {formatAmount(Number(bestCard?.total) * 12)}
            </p>
            <p className="text-[14px] uppercase -mt-4 text-[#FCB859] opacity-70 tracking-wider">
              Yearly benefits
            </p>
          </div>
        </div>
        {hideContainer ? (
          ""
        ) : (
          <div
            className="p-10 flex flex-col justify-center w-[80%] mx-auto rounded-3xl mt-10 border-b-1 border-[rgba(255,255,255,0.2)]"
            style={{
              background: "rgba(255,255,255,0.03)",
              backdropFilter: "blur(20px)",
            }}
          >
            {cardExtraInfo?.loungeAccess.length === 1 &&
            cardExtraInfo?.loungeAccess[0]?.toLowerCase() === "none" ? (
              ""
            ) : (
              <div className="flex max-md:flex-col max-md:gap-2">
                <p className="w-[30%] max-md:w-full text-[20px] font-bold text-[rgba(255,255,255,0.8)]">
                  Lounge access
                </p>
                <ul className="w-[70%] max-md:w-full max-md:text-justify list-disc text-white opacity-70">
                  {cardExtraInfo?.loungeAccess?.map(
                    (ele: string, index: number) => (
                      <li key={index}>{ele}</li>
                    )
                  )}
                </ul>
              </div>
            )}

            {cardExtraInfo?.addedBenefits.length === 1 &&
            cardExtraInfo?.addedBenefits[0]?.toLowerCase() === "none" ? (
              ""
            ) : (
              <div className="flex mt-5 max-md:flex-col max-md:gap-2">
                <p className="w-[30%] max-md:w-full text-[20px] font-bold text-[rgba(255,255,255,0.8)]">
                  Value added benefits
                </p>
                <ul className="w-[70%] max-md:w-full max-md:text-justify list-disc text-white opacity-70">
                  {cardExtraInfo?.addedBenefits?.map(
                    (ele: string, index: number) => (
                      <li key={index}>{ele}</li>
                    )
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CardsRecommendations;
