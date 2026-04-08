"use client";

import { useEffect, useState } from "react";
import Typography from "@/components/Typography/Typography";
import { BotRecommendationCreditCardProps } from "@/types/card";
import CardRecommendationModal from "../CardRecommendationModal/CardRecommendationModal";
import { useLazyGetRedirectUrlQuery } from "@/store/api";
import { Spinner } from "../ui/spinner";


function ChatCard(props: BotRecommendationCreditCardProps
) {
  const isWavedText = props?.annualFee?.toString()?.toLowerCase()?.includes("waiv");
  const [open, setOpen] = useState(false)

  const [getRedirectUrl, { data, isLoading }] =
    useLazyGetRedirectUrlQuery();

  useEffect(() => {
    if (props?.id) {
      getRedirectUrl({ cardId: props.id });
    }
  }, [props?.id]);

  const applyLink = data?.data;



  return (
    <div className="w-[230px]  h-[350px] max-md:h-[280px] shadow-sm overflow-visible border border-primary-orange bg-[linear-gradient(135deg,#30251E_60%,#6F4D34_100%,#AD744A_100%)] rounded-lg relative">
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
              Annual Loss(₹)
            </Typography>
          </div>

          <div className="w-full">
            <Typography variant="h4" className="text-left opacity-70">
              {props?.annualFee?.toString()?.split(" ")?.at(0) ?? 0}
            </Typography>
            <Typography
              variant="p"
              className="text-left pl-10 opacity-90"
            >
              Annual Fee {isWavedText ? "₹(waived)" : "(₹)"}
            </Typography>
          </div>

          <div className="w-full">
            <Typography variant="h4" className="text-left opacity-70">
              {props?.returnOnSpend ? props?.returnOnSpend : "Great"}
            </Typography>
            <Typography
              variant="p"
              className="text-left pl-10 opacity-90"
            >
              Return on Annual Spend(%)
            </Typography>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            className="text-white w-full border border-primary-orange/70 rounded-full text-[12px] py-1 p-2 cursor-pointer"
            onClick={() => setOpen(true)}
          >
            Why this?
          </button>

          {applyLink && (
            <a

              href={isLoading ? '' : applyLink}
              target="_blank"
              rel="noopener noreferrer"
              className={`"text-white min-w-[80px] w-full font-bold ${isLoading ? "bg-primary-orange/40" : "bg-primary-orange/80"} border border-secondary-orange rounded-full text-[12px] py-1 p-2 cursor-pointer text-center"`}
            >
              {isLoading ? <Spinner /> : 'Apply now'}
            </a>
          )}
        </div>
      </div>
      <CardRecommendationModal {...props} open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

export default ChatCard;
