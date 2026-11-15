"use client";
import HomeHero from "./components/HomeHero";
import WalletCheatSheet from "./components/WalletCheatSheet";
import FindNextCard from "./components/FindNextCard";
import FestiveRewards from "./components/FestiveRewards";
import PointsWorth from "./components/PointsWorth";
import TopDeals from "./components/TopDeals";
import { useGetDealsQuery, useGetRewardsQuery } from "@/store/userApi";
import { useGetLatestPointsQuery } from "@/store/redemption";
import {
  useGetUserSpendTransactionQuery,
  useGetWalletCheatSheetQuery,
} from "@/store/spendTransaction";
import { useGetUserBotChatSessionsDetailsQuery, useGetUserBotChatSessionsQuery } from "@/store/api";
import { useEffect, useMemo } from "react";
import { useAnalytics } from "@/lib/analytics/hooks/useAnalytics";
import { EventName } from "@/lib/analytics/types";
import { BaseMessage, MESSAGE_SOURCE } from "@/types/chatMessages";
import { safeParseJson } from "@/lib/utils/markdown";
import LastRecommendation from "./components/LastRecommendation";
import InsightsTeaser from "./components/InsightsTeaser";
import InstallAppBanner from "@/components/InstallApp/InstallAppBanner";
import { BotRecommendationCreditCardProps } from "@/types/card";
import type { CheatSheet, CheatSheetCard, CheatSheetRow } from "@/lib/advisor/walletCheatSheet";
import { homeStyles } from "./homeStyles";
import { Skeleton } from "@/components/ui/skeleton";

interface UserChatSession {
  channel: "recommendation";
  session_id: string;
  timestamp: string; // RFC 1123 date string
  title: string;
}

const Home = () => {
  const { track } = useAnalytics();

  const {
    data: spendTransaction,
    isFetching: isLookupsLoading,
    // Only the home.viewed `hasSpendData` flag reads this, so one row is enough.
  } = useGetUserSpendTransactionQuery({ limit: 1 });

  const {
    data: cheatSheet,
    isFetching: isCheatSheetLoading,
    isError: isCheatSheetError,
    refetch: refetchCheatSheet,
  } = useGetWalletCheatSheetQuery({});

  // Both secondary: a failure just hides the section rather than the page.
  const { data: rewards, isError: isRewardsError } = useGetRewardsQuery();
  const { data: deals } = useGetDealsQuery();
  const { data: points, isFetching: isPointsLoading, isError: isPointsError } =
    useGetLatestPointsQuery();

  const { data: userSessions,
    isFetching: userSessionsLoading,
  } = useGetUserBotChatSessionsQuery({})

  const latestSession = useMemo(() => userSessions?.sessions
    .slice()
    .sort(
      (a: UserChatSession, b: UserChatSession) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0], [userSessions?.sessions])

  const { data: userLastSessionDetail,
    isFetching: userSessionDetailsLoading,
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

  const hasSpendData = Array.isArray(spendTransaction) && spendTransaction.length > 0;
  const cheatSheetCards: CheatSheetCard[] = cheatSheet?.result?.cards ?? [];
  const cheatSheetRows: CheatSheetRow[] = cheatSheet?.result?.rows ?? [];
  const walletCardCount: number = cheatSheet?.result?.walletCardCount ?? 0;
  // Sent inside the cheat-sheet response when the wallet has nothing to show,
  // so the no-cards layout renders whole in one go.
  const example: CheatSheet | null = cheatSheet?.result?.example ?? null;

  const walletSlugs = useMemo(() => cheatSheetCards.map((c) => c.slug), [cheatSheetCards]);

  const isRecommendationLoading = userSessionsLoading || userSessionDetailsLoading;
  const isLoading = isLookupsLoading || isCheatSheetLoading || isRecommendationLoading;

  useEffect(() => {
    if (!isLoading) {
      track(EventName.HOME_VIEWED, {
        hasSpendData,
        hasRecommendations: lastRecommendationCards.length > 0,
        walletCardCount,
      });
    }
  }, [isLoading]);

  return (
    <div className="w-full grow bg-brown-background min-h-screen">
      <style>{homeStyles}</style>
      <div className="hm">
        <InstallAppBanner />

        {/* Needs both claims and wallet, so it never promotes a bank already
            claimed or a card already held. Space is held while they load so
            the page doesn't jump when the banner arrives above the hero. */}
        {(!rewards && !isRewardsError) || isCheatSheetLoading ? (
          <Skeleton className="h-[236px] w-full rounded-[22px] bg-white/5 max-md:h-[150px]" />
        ) : (
          rewards && !isCheatSheetError && (
            <FestiveRewards mode="promo" claims={rewards.claims} walletSlugs={walletSlugs} />
          )
        )}

        <HomeHero
          loading={isCheatSheetLoading}
          noCards={!isCheatSheetLoading && !isCheatSheetError && cheatSheetCards.length === 0}
          example={example}
          exampleLoading={isCheatSheetLoading}
        />

        <InsightsTeaser />

        <WalletCheatSheet
          cards={cheatSheetCards}
          rows={cheatSheetRows}
          walletCardCount={walletCardCount}
          example={example}
          exampleLoading={isCheatSheetLoading}
          isLoading={isCheatSheetLoading}
          isError={isCheatSheetError}
          onRetry={refetchCheatSheet}
        />

        {deals && <TopDeals merchants={deals.merchants} />}

        {/* Voucher status sits with the other rewards, just above points. */}
        {rewards && (
          <FestiveRewards mode="status" claims={rewards.claims} walletSlugs={walletSlugs} />
        )}

        {!isPointsLoading && !isPointsError && <PointsWorth cards={points ?? []} />}

        {lastRecommendationCards.length || isRecommendationLoading ? (
          <LastRecommendation isLoading={isRecommendationLoading} cards={lastRecommendationCards} />
        ) : (
          <FindNextCard />
        )}
      </div>
    </div>
  );
};

export default Home;
