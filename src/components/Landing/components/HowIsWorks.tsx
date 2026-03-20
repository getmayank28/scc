"use client";
import Typography from "@/components/Typography/Typography";
import { StickyScroll } from "@/components/ui/sticky-scroll-reveal";
import Image from "next/image";
import React from "react";

const content = [
  {
    title: "Tell Us How You Spend",
    description:"Answer a few quick questions about your shopping, travel, and everyday expenses. No exact numbers needed.",
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
    title: "We Analyze Your Credit Card Spending",
    description:
      "FiSense analyzes your spending patterns to identify where you earn and where you miss rewards.",
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
    title: "Find the Best Credit Cards for Your Spending",
    description:
     "We recommend the best credit cards and smart combinations based on your lifestyle, not generic lists.",
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
    title: "Use the Best Credit Card for Every Spend",
    description:
      "FiSense Spend Optimizer tells you exactly which card to use for each transaction. So, you maximize rewards on every purchase.",
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
  {
    title: "Redeem Credit Card Points for Maximum Value",
    description:
      "FiSense shows you the best way to redeem your points across flights, hotels, and vouchers. so, you get the highest value.",
    content: (
      <div className="flex -mt-0 w-[440px] h-[440px]  items-center justify-center text-white">
        <Image
          src="/images/reedem-points.png"
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
