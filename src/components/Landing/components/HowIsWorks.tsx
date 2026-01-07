"use client";
import Typography from "@/components/Typography/Typography";
import { StickyScroll } from "@/components/ui/sticky-scroll-reveal";
import Image from "next/image";
import React from "react";

const content = [
  {
    title: "Share how you spend",
    description:
      "Answer a few quick questions about your shopping, travel, and everyday expenses. No exact numbers. No bank jargon.",
    content: (
      <div className="flex mt-10  w-[400px] h-[400px]  items-center justify-center text-white">
        <Image
          src="/images/your-spends.png"
          width={400}
          height={400}
          alt="linear board demo"
        />
      </div>
    ),
  },
  {
    title: "We analyse your spending",
    description:
      "FiSense uses intelligent analysis to match credit cards to your lifestyle and spending habits, so you earn more from the same spending.",
    content: (
      <div className="flex -mt-0 w-[440px] h-[440px]  items-center justify-center text-white">
        <Image
          src="/images/spending-analyse.png"
          width={400}
          height={400}
          alt="linear board demo"
        />
      </div>
    ),
  },
  {
    title: "Get personalised card matches",
    description:
      "We recommend credit cards — and smart 2-card combinations when useful — based on your lifestyle, not generic lists.",
    content: (
      <div className="flex -mt-0 w-[440px] h-[440px]  items-center justify-center text-white">
        <Image
          src="/images/card-match.png"
          width={400}
          height={400}
          alt="linear board demo"
        />
      </div>
    ),
  },
  {
    title: "Decide when it feels right",
    description:
      "Compare with your current card, see potential savings, and apply only if and when you’re comfortable.",
    content: (
      <div className="flex -mt-0 w-[440px] h-[440px]  items-center justify-center text-white">
        <Image
          src="/images/compare.png"
          width={400}
          height={400}
          alt="linear board demo"
        />
      </div>
    ),
  },
];
export function HowItWorks() {
  return (
    <div className="w-full max-md:hidden flex flex-col justify-center items-center py-20">
      <Typography className="font-butlerpro mb-10 font-medium text-center leading-24">
        How it works?
      </Typography>
      <StickyScroll content={content} />
    </div>
  );
}
