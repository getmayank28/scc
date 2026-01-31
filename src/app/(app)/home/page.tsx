"use client";
import WelcomeScreen from "@/components/WelcomeScreen/WelcomeScreen";
import TopPerformingCardSection from "./components/TopPerformingCardSection";
import RecendSpendTransactionSection from "./components/RecendSpendTransactionSection";
import StatsSection from "./components/StatsSection";
import { useGetTransactionAnalyticsQuery, useGetUserSpendTransactionQuery } from "@/store/spendTransaction";
import { LoaderThree } from "@/components/ui/loader";
import Typography from "@/components/Typography/Typography";
import { Button } from "@/components/ui/stateful-button";

const Home = () => {
  const { data, isFetching: isAnalyticsLoading, isError: isAnalyticsError, refetch: refetchAnalytics } = useGetTransactionAnalyticsQuery({})

  const {
    data: spendTransaction,
    isFetching,
    isError: isSpendError,
    refetch: refetchSpendData,
  } = useGetUserSpendTransactionQuery({});

  // const { data: sessions } = useGetUserChatSessionQuery({})

  const isLoading = isFetching && isAnalyticsLoading
  const isError = isSpendError && isAnalyticsError

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
    <div className="w-full grow bg-brown-background text-white min-h-screen pt-30 pb-10 flex flex-col justify-start gap-8 items-center">
      {haveSpendData && <div className="flex gap-8 justify-center mx-auto">
        <TopPerformingCardSection topCards={data?.topCards} />
        <RecendSpendTransactionSection spendTransaction={spendTransaction} />
        <StatsSection spendAnalytics={data?.spendAnalytics} />
      </div>}
      <WelcomeScreen
        showUserCard={!haveSpendData}
        showRecommendationCard={true}
        showOptimizerCard={!haveSpendData} />
      {/* <LastRecommendation /> */}
      {/* <Divider className="mt-28 mb-10 max-md:w-[300px] max-md:mt-16"/> */}
      {/* <BestMarketCard/> */}
    </div>
  );
};

export default Home;
