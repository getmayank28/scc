"use client";
import WelcomeScreen from "@/components/WelcomeScreen/WelcomeScreen";
import TopPerformingCardSection from "./components/TopPerformingCardSection";
import RecendSpendTransactionSection from "./components/RecendSpendTransactionSection";
import StatsSection from "./components/StatsSection";
import { useGetTransactionAnalyticsQuery, useGetUserSpendTransactionQuery } from "@/store/spendTransaction";
import { LoaderThree } from "@/components/ui/loader";
import Typography from "@/components/Typography/Typography";
import { Button } from "@/components/ui/stateful-button";
import { useGetUserBotChatSessionsDetailsQuery, useGetUserBotChatSessionsQuery } from "@/store/api";
import { useMemo } from "react";
import { BaseMessage, MESSAGE_SOURCE } from "@/types/chatMessages";
import { convertBoldMarkdownToHtml } from "@/lib/utils/markdown";
import LastRecommendation from "./components/LastRecommendation";


interface UserChatSession {
  channel: "recommendation";
  session_id: string;
  timestamp: string; // RFC 1123 date string
  title: string;
}

const Home = () => {
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
    const content = userLastSessionDetail?.messages?.filter((msg: BaseMessage) => msg?.source === MESSAGE_SOURCE.ASSISTANT && msg?.content?.includes("```json")).sort(
      (a: { ts: string }, b: { ts: string }) =>
        new Date(b.ts).getTime() - new Date(a.ts).getTime()
    )[0]?.content

    if (content) {
      return JSON.parse(convertBoldMarkdownToHtml(content))?.cards
    }
    return ''
  }, [userLastSessionDetail])

  const isLoading = isFetching && isAnalyticsLoading && userSessionsLoading && userSessionDetailsLoading
  const isError = isSpendError && isAnalyticsError && userSessionsError && userSessionDetailsError

  if (isLoading) {
    return (
      <div className="w-full flex justify-center items-center  bg-brown-background  min-h-screen">
        <LoaderThree />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="w-full flex justify-center items-center  bg-brown-background  min-h-screen">
        <div className="flex flex-col justify-center items-center gap-4">
          <Typography variant="h3">Failed to get data</Typography>
          <Button onClick={() => {
            refetchAnalytics?.()
            refetchSpendData?.()
          }}>Retry</Button>
        </div>
      </div>
    )
  }

  const haveSpendData = spendTransaction?.length

  return (
    <div className="w-full grow bg-brown-background text-white min-h-screen pt-30 pb-10 max-md:px-5 max-md:py-20 max-md:pb-10 flex flex-col justify-start gap-8 items-center">
      {haveSpendData &&
        <div className="flex gap-8 justify-center mx-auto max-md:w-full max-md:flex-col max-md:gap-4">
          <TopPerformingCardSection topCards={data?.topCards} />
          <StatsSection spendAnalytics={data?.spendAnalytics} />
          <RecendSpendTransactionSection spendTransaction={spendTransaction} />
        </div>
      }
      {
        (!haveSpendData || !lastRecommendationCards) ? (
          <WelcomeScreen
            showUserCard={!haveSpendData}
            showRecommendationCard={!lastRecommendationCards || !lastRecommendationCards?.length}
            showOptimizerCard={!haveSpendData} />
        ) : (
          <></>
        )
      }
      {
        lastRecommendationCards?.length && <LastRecommendation cards={lastRecommendationCards} />
      }

      {/* <Divider className="mt-28 mb-10 max-md:w-[300px] max-md:mt-16"/> */}
      {/* <BestMarketCard/> */}
    </div>
  );
};

export default Home;
