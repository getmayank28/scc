"use client";
import Modal from "@/app/card/modal";
import Typography from "@/components/Typography/Typography";
import { Button } from "@/components/ui/button";
import { CreditCard, Lightbulb, Target } from "lucide-react";
import { FormData } from "./data";
import { MultiStepChatLoader } from "@/components/MultiStepChatLoader/MultiStepChatLoader";
import { getDashedFormattedValue } from "@/lib/utils/spendTransaction";
import { SpendOptimizerResponseCard } from "@/types/optimizer";

const loadingStates = [
  {
    text: "Learning your spending",
  },
  {
    text: "Categorizing your expenses",
  },
  {
    text: "Scanning your cards",
  },
  {
    text: "Analyzing rewards, and benefits",
  },
  {
    text: "Calculating cards rewards",
  },
  {
    text: "Optimizing for maximum benefits",
  },
  {
    text: "Running cards comparisons",
  },
  {
    text: "Finding the best match",
  },
];


const Card = ({
  isActive,
  name,
  benefitValue,
  whyThisCard,
  benefitInPercentage,
}: Partial<SpendOptimizerResponseCard> & {
  name: string;
  isActive?: boolean;
  benefitInPercentage: number;
}) => {
  return (
    <div
      className={`border min-w-[400px] flex-shrink-0 relative ${isActive ? "border-primary-orange" : "border-brown-border"} bg-brown-sidebar p-5 rounded-lg max-w-md`}
    >
      {isActive && (
        <div className="absolute -top-[12px] bg-primary-orange rounded-full w-[90px] py-1 px-2 flex justify-center items-center">
          <Typography
            variant="caption"
            className="text-[10px] text-left opacity-100 uppercase font-black"
          >
            best choice
          </Typography>
        </div>
      )}
      <div className="flex justify-between items-center">
        <div>
          <Typography
            variant="body"
            className="text-[20px] opacity-100 font-semibold text-white"
          >
            {name}
          </Typography>
          {/* <Typography
            variant="caption"
            className="text-[12px] text-left font-semibold capitalize"
          >
            Cashback specialist
          </Typography> */}
        </div>
        <div className="bg-white/10 rounded-md p-2 px-4">
          <CreditCard
            className={`${isActive ? "text-primary-orange" : "text-white/70"}`}
          />
        </div>
      </div>
      <div className="my-5">
        <Typography
          variant="caption"
          className="text-[12px] text-left opacity-100 text-[#617087] uppercase font-bold tracking-[1px]"
        >
          Expected benefits
        </Typography>
        <div className="flex items-end gap-1">
          <Typography
            variant="h3"
            className={`font-semibold ${isActive ? "text-primary-orange" : "text-white/90"}`}
          >
            {benefitValue?.toString()?.split(" ")?.at(0)}
          </Typography>
          <Typography
            variant="caption"
            className={`text-[14px] text-left opacity-100 ${isActive ? "text-secondary-success" : "text-[#617087]"} font-bold tracking-[1px]`}
          >
            {benefitInPercentage}% of value
          </Typography>
        </div>
      </div>

      <div
        className={`p-3 flex gap-1 border ${isActive ? "border-secondary-orange/70 bg-secondary-orange/20" : "border-white/20 bg-white/5"}    rounded-md mt-5`}
      >
        <Target
          size={16}
          className={`${isActive ? "text-primary-orange" : "text-[#617087]"}`}
        />
        <div>
          <Typography
            variant="caption"
            className="text-[10px] text-left opacity-100 uppercase font-bold tracking-[1px]"
          >
            How It Works
          </Typography>
          <Typography
            variant="caption"
            className="text-[12px] text-white/60 text-left opacity-100 font-semibold"
          >
            {whyThisCard}
          </Typography>
        </div>
      </div>
    </div>
  );
};

const Tag = ({ title }: { title: string }) => {
  return (
    <div className="bg-brown-sidebar p-2 px-3 border border-white/10 rounded-md">
      <Typography
        variant="caption"
        className="text-[10px] text-left opacity-100 text-white/80 capitalize font-bold tracking-[1px]"
      >
        {title}
      </Typography>
    </div>
  );
};

interface CardBenefit {
  card: string;
  bestPaymentPath: string;
  expectedBenefit: string; // e.g. "₹250"
  howItWorks: string;
}

const SpendOptimizerResult = ({
  data,
  open,
  onChange,
  formData,
  isLoading,
  winnerCard,
}: {
  data: {
    startMessage: string;
    cards: SpendOptimizerResponseCard[];
    endMessage: string;
  } | null;
  open: boolean;
  onChange: () => void;
  formData: FormData;
  isLoading?: boolean;
  winnerCard?: SpendOptimizerResponseCard | null;
}) => {
  const getBenefitInPercentage = (expectedBenefit: string) => {
    const firstDigit = expectedBenefit?.slice(1)?.split(" ")?.at(0);
    const benefit = firstDigit?.includes(",")
      ? Number(firstDigit.replace(/,/g, ""))
      : Number(firstDigit);
    const totalAmount = Number(formData?.amount);

    if (!benefit || !totalAmount) return 0;

    const benefitPercentage = (benefit / totalAmount) * 100;
    return Number(benefitPercentage.toFixed(1));
  };
  return (
    <Modal
      isOpen={open}
      onClose={onChange}
      removeCloseButton
      allowOutsideClickClose={false}
      className="m-10 p-10 h-fit min-h-[70vh] border-2 border-brown-border  bg-brown-background w-[900px] min-w-[950px] max-w-[80vw]"
    >
      {/* 996 758 */}
      <div className="flex flex-col justify-between">
        {isLoading ? (
          <div className="w-full flex justify-center items-center h-[63vh]">
            <MultiStepChatLoader loadingStates={loadingStates} />
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center">
              <div className="bg-primary-orange/30 border border-primary-orange rounded-full w-[140px] py-2 px-2 flex justify-center items-center">
                <Typography
                  variant="caption"
                  className="text-[12px] text-left opacity-100 uppercase font-black"
                >
                  current spend
                </Typography>
              </div>
              <Button disabled={isLoading} onClick={onChange}>
                Got it
              </Button>
            </div>
            <Typography variant="h3" className="text-left font-bold my-3">
              Optimizing rewards for{" "}
              <span className="text-primary-orange">₹{formData?.amount}</span>
            </Typography>
            <div className="flex gap-2 items-center justify-start mb-5">
              <Tag title={getDashedFormattedValue(formData?.category)} />
              <Tag title={getDashedFormattedValue(formData?.merchant)} />
              <Tag title={getDashedFormattedValue(formData?.paymentMethod)} />
              <Tag title={getDashedFormattedValue(formData?.emi)} />
            </div>
            <div className="flex gap-4 py-5 mt-5 overflow-x-auto">
              {data?.cards?.map((card: SpendOptimizerResponseCard) => (
                <Card
                  key={card?.cardName}
                  isActive={card?.isBestOption}
                  name={card?.cardName}
                  benefitValue={card?.benefitValue}
                  whyThisCard={card?.whyThisCard}
                  benefitInPercentage={getBenefitInPercentage(
                    card?.benefitValue
                  )}
                />
              ))}
            </div>
            <div className="w-full flex gap-2 justify-start items-center rounded-lg border p-4 py-3 border-brown-border">
              <div className="flex gap-4 justify-start items-center">
                <div className="bg-primary-orange rounded-full p-3">
                  <Lightbulb size={30} className="text-white" />
                </div>
                <div>
                  <Typography
                    variant="body"
                    className="text-left text-[20px] opacity-100 font-semibold text-white"
                  >
                    Recommendation
                  </Typography>
                  <div>
                    <Typography
                      variant="caption"
                      className="text-[14px] text-left font-semibold opacity-100"
                    >
                      Use your{" "}
                      <span className="font-bold text-primary-orange !opacity-100">
                        {winnerCard?.cardName}
                      </span>{" "}
                      for this transaction to maximize your returns
                    </Typography>
                    <Typography
                      variant="caption"
                      className="text-[14px] text-left font-semibold opacity-100"
                    >
                      Your will get{" "}
                      <span className="font-bold text-secondary-success !opacity-100">
                        {getBenefitInPercentage(
                          winnerCard?.benefitValue as string
                        )}
                        %
                      </span>{" "}
                      of value with this card
                    </Typography>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default SpendOptimizerResult;
