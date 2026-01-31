"use client";

import { useState } from "react";
import Typography from "@/components/Typography/Typography";
import { BotRecommendationCreditCardProps } from "@/types/card";
import CardRecommendationModal from "../CardRecommendationModal/CardRecommendationModal";


function ChatCard(props: BotRecommendationCreditCardProps
) {

  const isWavedText = props?.annualFee?.toLowerCase()?.includes("waiv");
  const [open, setOpen] = useState(false)



  return (
    <div className="w-[230px]  h-[350px] shadow-sm overflow-visible border border-primary-orange bg-[linear-gradient(135deg,#30251E_60%,#6F4D34_100%,#AD744A_100%)] rounded-lg relative">
      <div className="absolute w-full top-0 left-0 h-full p-3 py-3 flex flex-col justify-between">
        <div className="flex gap-1 items-center">
          {/* {bankIcon && <p>{bankIcon}</p>} */}
          <Typography variant="p" className="font-bold text-left">
            {props?.cardName}
          </Typography>
        </div>

        <div className="flex flex-col gap-2">
          <Typography
            variant="p"
            className="uppercase text-left text-primary-orange font-bold tracking-[2px]"
          >
            Key points
          </Typography>

          <div className="w-full">
            <Typography variant="h4" className="text-left opacity-90">
              {props?.netAnnualRewardLoss ? props?.netAnnualRewardLoss : "Maximum"}
            </Typography>
            <Typography
              variant="p"
              className="text-left pl-10 opacity-70"
            >
              Annual Loss
            </Typography>
          </div>

          {props?.annualFee && (
            <div className="w-full">
              <Typography variant="h4" className="text-left opacity-70">
                {props?.annualFee?.split(" ")?.at(0)}
              </Typography>
              <Typography
                variant="p"
                className="text-left pl-10 opacity-90"
              >
                Annual Fee {isWavedText && "(waived)"}
              </Typography>
            </div>
          )}

          <div className="w-full">
            <Typography variant="h4" className="text-left opacity-70">
              {props?.returnOnSpend ? props?.returnOnSpend : "Great"}
            </Typography>
            <Typography
              variant="p"
              className="text-left pl-10 opacity-90"
            >
              Return on Annual Spend
            </Typography>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            className="text-white w-full border border-primary-orange/70 rounded-full text-[12px] py-1 p-2 cursor-pointer"
            onClick={()=>setOpen(true)}
          >
            Why this?
          </button>

          {props?.applyLink && (
            <a
              href={props?.applyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white min-w-[80px] w-full font-bold bg-primary-orange/80 border border-secondary-orange rounded-full text-[12px] py-1 p-2 cursor-pointer text-center"
            >
              Apply now
            </a>
          )}
        </div>
        {/* <div className="flex pl-0 p-4 py-1 gap-8 justify-center">
        <AnimatedTooltip onClick={handleFlip} items={whyThis} />
        <AnimatedTooltip
          onClick={() => window.open(apply, "_blank")}
          items={applyNow}
        />
        <AnimatedTooltip onClick={() => handleAddToFav()} items={addToFav} />
      </div> */}
      </div>
      <CardRecommendationModal {...props} open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

export default ChatCard;
