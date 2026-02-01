import { useChatCommunicationMutation } from "@/store/api";
import useSocket from "./useSocket";
import { joinTextMessagesByMid } from "../utils/content";
import { convertBoldMarkdownToHtml } from "../utils/markdown";
import { useMemo, useState } from "react";
import { RedemptionData } from "@/types/redemption";
import { convertStringToNumber } from "../utils/number";

const useRedemptionData = () => {
    const { createChatSessionToken } = useSocket();
    const [communicateToBot, { isLoading: isRedemptionLoading }] = useChatCommunicationMutation();
    const [redemptionData, setRedemptionData] = useState<RedemptionData | null>(null)
    const [redemptionPoints, setRedemptionPoints] = useState<string | null>('')


    const handleRedemptionSubmit = async (cardName: string, points: string) => {
        const token = await createChatSessionToken();
        const data = await communicateToBot({
            message: `I have ${cardName} card and ${points} points, tell me the best possible way to redeem this for maximux benefits`,
            token: token,
        });
        setRedemptionPoints(points)
        const content = joinTextMessagesByMid(data?.data?.messages);

        const msg = content?.find(msg => msg?.m_id && msg?.content)?.content || ''
        const finalData = JSON.parse(convertBoldMarkdownToHtml(msg))
        setRedemptionData(finalData)
    }

    const redemptionOptionsData = useMemo(() => {
        const data = redemptionData?.redemptionOptions ?? []
        const pointsInNumber = redemptionPoints ? convertStringToNumber(redemptionPoints) : 0
        const highestReturn = Math.max(...data?.map(ele => pointsInNumber * ele?.pointConversionRatioInInr))

        const newData = data?.map(ele => ({ ...ele, highestReturn, points:pointsInNumber }))
        return newData
    }, [redemptionData?.redemptionOptions, redemptionPoints])

    return { handleRedemptionSubmit, isRedemptionLoading, redemptionOptionsData, redemptionRawData: redemptionData }

}

export default useRedemptionData