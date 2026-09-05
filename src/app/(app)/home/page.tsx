"use client";
import WelcomeScreen from "@/components/WelcomeScreen/WelcomeScreen";
import TopPerformingCardSection from "./components/TopPerformingCardSection";
import RecendSpendTransactionSection from "./components/RecendSpendTransactionSection";
import StatsSection from "./components/StatsSection";
import { useGetTransactionAnalyticsQuery, useGetUserSpendTransactionQuery } from "@/store/spendTransaction";
import Typography from "@/components/Typography/Typography";
import { Button } from "@/components/ui/stateful-button";
import { useGetUserBotChatSessionsDetailsQuery, useGetUserBotChatSessionsQuery } from "@/store/api";
import { useEffect, useMemo } from "react";
import { useAnalytics } from "@/lib/analytics/hooks/useAnalytics";
import { EventName } from "@/lib/analytics/types";
import { BaseMessage, MESSAGE_SOURCE } from "@/types/chatMessages";
import { safeParseJson } from "@/lib/utils/markdown";
import LastRecommendation from "./components/LastRecommendation";
import InsightsTeaser from "./components/InsightsTeaser";
import { BotRecommendationCreditCardProps } from "@/types/card";


interface UserChatSession {
  channel: "recommendation";
  session_id: string;
  timestamp: string; // RFC 1123 date string
  title: string;
}

const Home = () => {
  const { track } = useAnalytics();
  const { data, isFetching: isAnalyticsLoading, isError: isAnalyticsError, refetch: refetchAnalytics } = useGetTransactionAnalyticsQuery({})

  const {
    data: spendTransaction,
    isFetching,
    isError: isSpendError,
    refetch: refetchSpendData,
  } = useGetUserSpendTransactionQuery({});

  const { data: userSessions,
    isFetching: userSessionsLoading,
    isError: userSessionsError,
  } = useGetUserBotChatSessionsQuery({})

  const latestSession = useMemo(() => userSessions?.sessions
    .slice()
    .sort(
      (a: UserChatSession, b: UserChatSession) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0], [userSessions?.sessions])

  const { data: userLastSessionDetail,
    isFetching: userSessionDetailsLoading,
    isError: userSessionDetailsError,
  } = useGetUserBotChatSessionsDetailsQuery(latestSession?.session_id, {
    skip: !latestSession?.session_id
  })

  const lastRecommendationCards = useMemo(() => {
    const content = userLastSessionDetail?.messages
      ?.filter(
        (msg: BaseMessage) =>
          msg.source === MESSAGE_SOURCE.ASSISTANT &&
          msg.content?.includes("```json")
      )
      ?.sort(
        (a:{ts:string}, b:{ts:string}) =>
          new Date(b.ts).getTime() - new Date(a.ts).getTime()
      )[0]?.content;
  
    if (!content) return [];
  
    const parsed = safeParseJson<{ cards: BotRecommendationCreditCardProps[] }>(content);
    return parsed?.cards ?? [];
  }, [userLastSessionDetail]);

  const haveSpendData = spendTransaction?.length;
  const isLoading = isFetching || isAnalyticsLoading || userSessionsLoading || userSessionDetailsLoading
  const isError = isSpendError || isAnalyticsError || userSessionsError || userSessionDetailsError

  useEffect(() => {
    if (!isLoading) {
      track(EventName.HOME_VIEWED, {
        hasSpendData: !!haveSpendData,
        hasRecommendations: !!lastRecommendationCards?.length,
      });
    }
  }, [isLoading]);

  if (isError) {
    return (
      <div className="w-full flex justify-center items-center  bg-brown-background  min-h-screen">
        <div className="flex flex-col justify-center items-center gap-4">
          <Typography variant="h3">Failed to get data</Typography>
          <Button onClick={() => {
            track(EventName.HOME_ERROR_RETRY_CLICKED, {});
            refetchAnalytics?.()
            refetchSpendData?.()
          }}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full grow bg-brown-background text-white min-h-screen pt-20 pb-10 max-md:px-5 max-md:py-20 max-md:pb-10 flex flex-col justify-start gap-8 items-center">
      {/* Banner and the panel row share one shrink-to-fit column, so the banner
          spans exactly the panels' width without hardcoding a pixel value. */}
      <div className="flex flex-col gap-8 items-stretch max-md:w-full max-md:gap-4">
        <InsightsTeaser />

        {haveSpendData || isFetching ?
          <div className="flex gap-8 justify-center mx-auto max-md:w-full max-md:flex-col max-md:gap-4">
            <TopPerformingCardSection isLoading={isFetching} topCards={data?.topCards} />
            <StatsSection isLoading={isFetching} spendAnalytics={data?.spendAnalytics} />
            <RecendSpendTransactionSection isLoading={isFetching} spendTransaction={spendTransaction} />
          </div>:<></>
        }
      </div>
      {
        (!haveSpendData || !lastRecommendationCards) && !isLoading? (
          <WelcomeScreen
            showUserCard={!haveSpendData}
            showRecommendationCard={!lastRecommendationCards || !lastRecommendationCards?.length}
            showOptimizerCard={!haveSpendData}
            track={track} />
        ) : (
          <></>
        )
      }
      {
        lastRecommendationCards?.length || userSessionsLoading || userSessionDetailsLoading ? <LastRecommendation isLoading={userSessionsLoading || userSessionDetailsLoading} cards={lastRecommendationCards} />:<></>
      }

      {/* <Divider className="mt-28 mb-10 max-md:w-[300px] max-md:mt-16"/> */}
      {/* <BestMarketCard/> */}
    </div>
  );
};

export default Home;
