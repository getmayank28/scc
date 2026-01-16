"use client";
import HeaderText from "@/components/HeaderText/HeaderText";
import SpendOptimizerDesktop from "./SpendOptimizerDesktop";
import SpendOptimizerMobile from "./SpendOptimizerMobile";
import UserCards from "./UserCards";
import { useEffect, useMemo, useState } from "react";
import useUserData from "@/lib/hooks/useUserData";
import { useGetUserCardsQuery } from "@/store/api";
import { CreditCard } from "@/types/card";

const SpendOptimizer = () => {
  const [userCards, setUserCards] = useState<Array<string>>([]);
  const { userId } = useUserData();
  const { data: cards, isFetching: isCardsLoading } = useGetUserCardsQuery({
    userId,
  });

  useEffect(() => {
    if (cards?.length) {
      const cardIds = cards?.map((card: { _id: string }) => card?._id);
      setUserCards(cardIds);
    }
  }, [cards]);


  const selectedCards = useMemo(() => {
   return cards?.filter((card:CreditCard) => userCards?.includes(card?._id))
  },[cards,userCards])

  return (
    <div className="flex flex-col p-20 h-screen max-md:p-6 max-md:h-auto">
      <HeaderText
        containerClassName="items-start"
        title="Spend Optimizer"
        titleVariant="h3"
        titleClassName="font-bold"
        contentVariant="caption"
        content="Which of my cards should I use for this purchase?"
      />
      <UserCards
        cards={cards}
        userCards={userCards}
        isCardsLoading={isCardsLoading}
        setUserCards={setUserCards}
      />
      <SpendOptimizerDesktop selectedCards={selectedCards} isCardsLoading={isCardsLoading}/>
      <SpendOptimizerMobile />
    </div>
  );
};

export default SpendOptimizer;
