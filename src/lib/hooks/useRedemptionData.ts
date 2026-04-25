import { useChatCommunicationMutation } from "@/store/api";
import useSocket from "./useSocket";
import { joinTextMessagesByMid } from "../utils/content";
import { convertBoldMarkdownToHtml } from "../utils/markdown";
import { useEffect, useMemo, useState } from "react";
import { RedemptionData } from "@/types/redemption";
import { convertStringToNumber } from "../utils/number";
import { useAddRedemptionMutation } from "@/store/redemption";

const useRedemptionData = () => {
  const { createChatSessionToken } = useSocket();
  const [communicateToBot, { isLoading: isRedemptionLoading }] =
    useChatCommunicationMutation();
  const [addRedemption] = useAddRedemptionMutation();

  const [redemptionData, setRedemptionData] = useState<RedemptionData | null>(
    null,
  );
  const [redemptionPoints, setRedemptionPoints] = useState<string | null>("");
  const [selectedCardName, setSelectedCardName] = useState<string | null>("");

  const handleRedemptionSubmit = async (cardName: string, points: string) => {
    const token = await createChatSessionToken();
    const data = await communicateToBot({
      message: `I have ${cardName} card and ${points} points, tell me the best possible way to redeem this for maximux benefits`,
      token: token,
    });
    setRedemptionPoints(points);
    setSelectedCardName(cardName);
    const content = joinTextMessagesByMid(data?.data?.messages);

    const msg =
      content?.find((msg) => msg?.m_id && msg?.content)?.content || "";
    const finalData = JSON.parse(convertBoldMarkdownToHtml(msg));

    setRedemptionData(finalData);
  };

  const redemptionOptionsData = useMemo(() => {
    const data = redemptionData?.redemptionOptions ?? [];
    const pointsInNumber = redemptionPoints
      ? convertStringToNumber(redemptionPoints)
      : 0;
    const highestReturn = Math.max(
      ...data?.map((ele) => pointsInNumber * ele?.pointConversionRatioInInr),
    );

    const newData = data?.map((ele) => ({
      ...ele,
      highestReturn,
      points: pointsInNumber,
      currentValue: pointsInNumber * Number(ele?.pointConversionRatioInInr),
    }));

    return newData;
  }, [redemptionData?.redemptionOptions, redemptionPoints]);

  useEffect(() => {
    if (!selectedCardName || !redemptionPoints || !redemptionOptionsData) {
      return;
    }
    const pointsInNumber = redemptionPoints
      ? convertStringToNumber(redemptionPoints)
      : 0;
    const body = {
      cardName: selectedCardName,
      points: pointsInNumber,
      redemptionOptions: redemptionOptionsData,
    };

    // fire-and-forget (no await)
    void addRedemption(body).catch((err) => {
      console.error("Silent addRedemption failed", err);
    });
  }, [selectedCardName, redemptionPoints, redemptionOptionsData]);

  return {
    handleRedemptionSubmit,
    isRedemptionLoading,
    redemptionOptionsData,
    redemptionRawData: redemptionData,
  };
};

export default useRedemptionData;
