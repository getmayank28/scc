"use client";
import HeaderText from "@/components/HeaderText/HeaderText";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/stateful-button";
import { useState } from "react";
import RedemptionTable from "./RedemptionTable";
import Typography from "@/components/Typography/Typography";
import useRedemptionData from "@/lib/hooks/useRedemptionData";
import RedemptionCard from "./RedemptionCard";
import { IconBulb } from "@tabler/icons-react";
import { RedemptionSkeleton } from "./Loader";
import RedemptionInstructionsModal from "./RedemptionInstructionsModal";
import {
  redemptionInstructions,
  supportedBankIds,
  bankRedemptionPortals,
} from "./redemptionInstructions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetUserCardsQuery } from "@/store/api";
import useUserData from "@/lib/hooks/useUserData";
import useNav from "@/lib/hooks/useNav";
import { CircleQuestionMark } from "lucide-react";

const PointRedemption = () => {
  const [query, setQuery] = useState("");
  const [points, setPoints] = useState("");
  const [errors, setErrors] = useState({ points: false, card: false });
  const [showInstructions, setShowInstructions] = useState(false);
  const { userId } = useUserData();
  const { goToProfile } = useNav();

  const { data: userCards } = useGetUserCardsQuery(
    { userId },
    {
      skip: !userId,
    },
  );
  const {
    handleRedemptionSubmit,
    isRedemptionLoading,
    redemptionOptionsData,
    redemptionRawData: redemptionData,
  } = useRedemptionData();

  const handleSubmit = async () => {
    if (!points && !query) {
      setErrors({ points: true, card: true });
      return;
    }
    if (!points) {
      setErrors((prev) => ({ ...prev, points: true }));
      return;
    }
    if (!query) {
      setErrors((prev) => ({ ...prev, card: true }));
      return;
    }

    handleRedemptionSubmit(query, points);
  };
  // Find the selected card's bankId and check if instructions exist
  const selectedCard = userCards?.find(
    (card: { cardId: { name: string } }) => card.cardId?.name === query,
  );
  const selectedBankId = selectedCard?.cardId?.bankId as string | undefined;
  const hasInstructions = selectedBankId
    ? supportedBankIds.has(selectedBankId)
    : false;
  const currentInstructions =
    selectedBankId && hasInstructions
      ? redemptionInstructions[selectedBankId]
      : null;

  const portalLink = selectedBankId ? bankRedemptionPortals[selectedBankId] ?? "" : "";
  const redemptionOptionsSortedData = redemptionOptionsData.sort((a, b) => b.currentValue - a.currentValue);
  return (
    <div className="flex h-full bg-brown-background flex-col max-md:px-4 max-md:pt-20 p-20 min-h-screen">
      <div className="flex items-start justify-between">
      <HeaderText
        containerClassName="items-start"
        title="Points Redemption"
        content="Turn your credit card points into maximum value"
        contentVariant="caption"
        titleVariant="h3"
        titleClassName="font-bold"
      />
      {hasInstructions && redemptionOptionsSortedData?.length > 0 && (
        <Button onClick={() => setShowInstructions(true)} className="max-md:hidden">How to Redeem?</Button>
      )}
        {hasInstructions && redemptionOptionsSortedData?.length > 0 && (
        <div className="bg-primary-orange p-2 rounded-full hidden max-md:flex" onClick={() => setShowInstructions(true)}><CircleQuestionMark color="#fff"/></div>
      )}
      </div>
      <div className="flex rounded-md border border-brown-border max-w-6xl bg-brown-sidebar p-5 gap-4 mt-4 mb-2 max-md:flex-col">
        <div className="w-full">
          <Select
            disabled={isRedemptionLoading}
            value={query}
            onValueChange={(value) => setQuery(value)}
          >
            <SelectTrigger
              id="paymentMethod"
              className={`!h-12 w-full border-primary-orange text-white`}
            >
              <SelectValue placeholder="Select card" />
            </SelectTrigger>
            <SelectContent
              className="!max-h-[300px] !max-w-[430px]"
              position="popper"
              sideOffset={4}
            >
              {userCards?.map((card: { cardId: { name: string } }) => {
                return (
                  <SelectItem key={card.cardId?.name} value={card.cardId?.name}>
                    <div className="flex items-center gap-2">
                      <span>{card.cardId?.name}</span>
                    </div>
                  </SelectItem>
                );
              })}
              {!userCards?.length && (
                <div className="flex items-center gap-2 p-2 justify-between">
                  <span>No cards added</span>
                  <Button onClick={goToProfile} className="h-8 px-3">
                    Add card
                  </Button>
                </div>
              )}
            </SelectContent>
          </Select>
        </div>
        <Input
          disabled={isRedemptionLoading}
          id="amount"
          type="text"
          placeholder="Enter points..."
          value={points}
          onChange={(e) => setPoints(e.target.value)}
          className={`h-12 max-md:text-xs max-w-md text-lg max-md:mr-auto text-white ${
            errors.points ? "border-destructive" : "border-primary-orange"
          }`}
        />
        <Button
          disabled={isRedemptionLoading}
          className="rounded-lg h-12 w-xl max-md:w-full px-8 bg-primary-orange/70 max-md:max-w-md"
          onClick={handleSubmit}
        >
          Check My Points Value
        </Button>
      </div>
      {isRedemptionLoading ? (
        <RedemptionSkeleton />
      ) : (
        <>
          {redemptionOptionsSortedData?.length ? (
            <>
              <div className="pt-10 pb-1 max-md:hidden">
                <Typography
                  variant="body"
                  className="text-left opacity-100 font-bold uppercase tracking-wider"
                >
                  Best Options
                </Typography>
                <Typography
                  variant="caption"
                  className="text-left opacity-90 font-medium"
                >
                  {redemptionData?.startMessage}
                </Typography>
              </div>
              <div className="grid grid-cols-3 gap-4 py-4 max-md:gap-54 max-md:overflow-x-auto max-md:hidden">
                {redemptionOptionsSortedData?.slice(0, 3)?.map((ele) => (
                  <RedemptionCard
                    key={ele?.category}
                    isBestOption={
                      Number(ele?.points) * ele?.pointConversionRatioInInr ===
                      ele?.highestReturn
                    }
                    tag={ele?.category}
                    title={ele?.redemptionOptionTitle}
                    points={ele?.points}
                    conversionRate={`1:${ele?.pointConversionRatioInInr?.toFixed(2)}`}
                    conversionValue=""
                    totalValue={
                      Number(ele?.points) * ele?.pointConversionRatioInInr
                    }
                    infoText={ele?.note?.slice(0, 90)}
                    buttonText="Redeem now"
                    applyLink={portalLink}
                  />
                ))}
              </div>
              <Typography
                variant="body"
                className="mt-10 text-left opacity-100 font-bold uppercase tracking-wider"
              >
                value breakdown
              </Typography>
              <RedemptionTable data={redemptionOptionsSortedData} portalLink={portalLink} />
            </>
          ) : (
            <></>
          )}
          {redemptionData?.recommendationForMaxBenefits ||
          redemptionData?.endMessage ? (
            <div className="p-6 pl-4 mt-6 max-md:p-2 max-md:py-4 flex gap-2 bg-secondary-orange/30 border-l-4 border-primary-orange">
              <div className="h-8 w-8">
                <IconBulb size={40} color="#F35A13" className="!w-8 !h-8" />
              </div>
              <Typography
                variant="caption"
                className="text-left opacity-100 font-bold max-md:font-medium"
              >
                {redemptionData?.recommendationForMaxBenefits}{" "}
                {redemptionData?.endMessage}
              </Typography>
            </div>
          ) : (
            <></>
          )}
        </>
      )}
      <RedemptionInstructionsModal
        open={showInstructions}
        onOpenChange={setShowInstructions}
        instructions={currentInstructions}
      />
    </div>
  );
};

export default PointRedemption;
