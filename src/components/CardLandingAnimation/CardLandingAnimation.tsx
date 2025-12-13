"use client"
import Image from "next/image";
import Typography from "../Typography/Typography";
import { LayoutTextFlip } from "../ui/layout-text-flip";
import React from 'react';




const CardLandingAnimation = () => {
  return (
    <div className="h-[220px] w-[390px] overflow-visible bg-background-primary border border-white/40 rounded-lg relative">
        <Image
          width={230}
          height={350}
          src={`/images/pattern2.png`}
          className="h-[220px] w-[390px] rounded-lg opacity-10"
          alt="card"
          draggable="false"
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full">
          <Typography
            variant="body"
            className="mb-3 uppercase text-[16px] font-medium tracking-[2px]"
          >
            Your money deserves a smarter
          </Typography>
          <div className="flex justify-center">
            <LayoutTextFlip
              text=""
              words={[
                "Travel",
                "Online Spends",
                "Food & Dining",
                "All Rounder",
              ]}
            />
          </div>
          <Typography
            variant="body"
            className="mt-3 uppercase text-[16px] font-medium tracking-[2px]"
          >
            Credit card
          </Typography>
        </div>
      </div>
  );
};

export default CardLandingAnimation;
