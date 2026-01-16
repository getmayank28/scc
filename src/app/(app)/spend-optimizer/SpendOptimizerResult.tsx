"use client";
import Modal from "@/app/card/modal";
import Typography from "@/components/Typography/Typography";
import { Button } from "@/components/ui/button";
import { CreditCard, Lightbulb, Target } from "lucide-react";
import { FormData } from "./data";
import { MultiStepChatLoader } from "@/components/MultiStepChatLoader/MultiStepChatLoader";
import { useMemo } from "react";

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

interface PaymentCardBenefit {
  card: string;
  bestPaymentPath: string;
  expectedBenefit: string;
  howItWorks: string;
}

interface CardBenefit {
  card: string;
  bestPaymentPath: string;
  expectedBenefit: string; // e.g. "₹250"
  howItWorks: string;
}

function parseBenefit(amount: string): number {
  return Number(amount.replace(/[^\d.]/g, ""));
}

function getBestCard(cards: CardBenefit[]): CardBenefit | null {
  if (cards?.length === 0) return null;

  return cards?.reduce((maxCard, currentCard) => {
    const maxBenefit = parseBenefit(maxCard.expectedBenefit);
    const currentBenefit = parseBenefit(currentCard.expectedBenefit);

    return currentBenefit > maxBenefit ? currentCard : maxCard;
  });
}

const Card = ({
  isActive,
  name,
  expectedBenefit,
  howItWorks,
  benefitInPercentage,
}: Partial<PaymentCardBenefit> & {
  name: string;
  isActive?: boolean;
  benefitInPercentage: number;
}) => {
  return (
    <div
      className={`border min-w-[400px] flex-shrink-0 relative ${isActive ? "border-primary-orange" : "border-[#617087]/60"} bg-background-primary p-5 rounded-lg max-w-md`}
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
          <Typography
            variant="caption"
            className="text-[12px] text-left font-semibold capitalize"
          >
            Cashback specialist
          </Typography>
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
            {expectedBenefit?.toString()?.split(" ")?.at(0)}
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
            {howItWorks}
          </Typography>
        </div>
      </div>
    </div>
  );
};

const Tag = ({ title }: { title: string }) => {
  return (
    <div className="bg-[#0A0C10] p-2 px-3 border border-white/10 rounded-md">
      <Typography
        variant="caption"
        className="text-[10px] text-left opacity-100 text-white/80 capitalize font-bold tracking-[1px]"
      >
        {title}
      </Typography>
    </div>
  );
};

const SpendOptimizerResult = ({
  data,
  open,
  onChange,
  formData,
  isLoading,
}: {
  data: {
    message: string;
    cards: PaymentCardBenefit[];
    endMessage: string;
  } | null;
  open: boolean;
  onChange: () => void;
  formData: FormData;
  isLoading?: boolean;
}) => {

  const getFormattedValue = (value: string) => {
    const needToFormat = value?.includes("-");

    if (!needToFormat) return value;

    return value?.split("-")?.join(" ");
  };

  const winnerCard = useMemo(() => {
    return getBestCard(data?.cards as CardBenefit[]);
  }, [data?.cards]);

  const getBenefitInPercentage = (expectedBenefit: string) => {
    const benefit = Number(expectedBenefit?.slice(1)?.split(" ")?.at(0));
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
      className="m-10 p-10 h-fit min-h-[70vh] border-2 border-white/20  bg-black w-[900px] min-w-[950px] max-w-[80vw]"
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
              <Tag title={getFormattedValue(formData?.category)} />
              <Tag title={getFormattedValue(formData?.merchant)} />
              <Tag title={getFormattedValue(formData?.paymentMethod)} />
              <Tag title={getFormattedValue(formData?.emi)} />
            </div>
            <div className="flex gap-4 py-5 mt-5 overflow-x-auto">
              {data?.cards?.map((card: PaymentCardBenefit) => (
                <Card
                  key={card?.card}
                  isActive={winnerCard?.card?.toLowerCase() === card?.card?.toLowerCase()}
                  name={card?.card}
                  expectedBenefit={card?.expectedBenefit}
                  howItWorks={card?.howItWorks}
                  benefitInPercentage={getBenefitInPercentage(
                    card?.expectedBenefit
                  )}
                />
              ))}
            </div>
            <div className="w-full flex gap-2 justify-start items-center rounded-lg border p-4 border-secondary-orange">
              <div className="flex gap-2 justify-start items-center">
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
                      Use your <span className="font-bold text-primary-orange !opacity-100">{winnerCard?.card}</span> for this
                      transaction to maximize your returns
                    </Typography>
                    <Typography
                      variant="caption"
                      className="text-[14px] text-left font-semibold opacity-100"
                    >
                      Your will get{" "}
                      <span className="font-bold text-secondary-success !opacity-100">
                        {getBenefitInPercentage(
                          winnerCard?.expectedBenefit as string
                        )}%
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
