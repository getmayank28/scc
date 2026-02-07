"use client";
import HeaderText from "@/components/HeaderText/HeaderText";
import SpendOptimizerDesktop from "./SpendOptimizerDesktop";
import SpendOptimizerMobile from "./SpendOptimizerMobile";
import UserCards from "./UserCards";
import { useEffect, useMemo, useState } from "react";
import useUserData from "@/lib/hooks/useUserData";
import { useGetUserCardsQuery } from "@/store/api";
import { CreditCard } from "@/types/card";
import { useAddSpendTransactionMutation } from "@/store/spendTransaction";
import { SpendTransaction } from "./data";
import SpendOptimizerTabs from "./Tabs";
import SpendTransactionHistory from "./SpendTransaction";

const SpendOptimizer = () => {
  const [tab, setTab] = useState("optimizers");
  const [userCards, setUserCards] = useState<Array<string>>([]);
  const { userId } = useUserData();
  const { data: cards, isFetching: isCardsLoading } = useGetUserCardsQuery({
    userId,
  });

  const [addSpendTransaction] = useAddSpendTransactionMutation();

  useEffect(() => {
    if (cards?.length) {
      const cardIds = cards?.map((card: { _id: string }) => card?._id);
      setUserCards(cardIds);
    }
  }, [cards]);

  const selectedCards = useMemo(() => {
    return cards?.filter((card: CreditCard) => userCards?.includes(card?._id));
  }, [cards, userCards]);

  const handleAddSpendTransaction = async (payload: SpendTransaction) => {
    await addSpendTransaction({ ...payload, userId });
  };

  return (
    <div className="flex bg-brown-background flex-col p-20 h-screen max-md:p-6 max-md:pt-20 max-md:h-auto">
      <div className="flex justify-between items-center max-md:flex-col max-md:items-start max-md:gap-4">
        <HeaderText
          containerClassName="items-start"
          title={`Spend ${tab === "optimizers" ? 'Optimizer' : 'History'}`}
          titleVariant="h3"
          titleClassName="font-bold"
          contentVariant="caption"
          content="Which of my cards should I use for this purchase?"
        />
        <SpendOptimizerTabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "optimizers", label: "Optimizers" },
            { value: "transactions", label: "Transactions" },
          ]}
        />
      </div>
      {tab === "optimizers" ? (
        <>
          <UserCards
            cards={cards}
            userCards={userCards}
            isCardsLoading={isCardsLoading}
            setUserCards={setUserCards}
          />
          <SpendOptimizerDesktop
            selectedCards={selectedCards}
            isCardsLoading={isCardsLoading}
            onAddSpendTransaction={handleAddSpendTransaction}
          />
          <SpendOptimizerMobile
            selectedCards={selectedCards}
            isCardsLoading={isCardsLoading}
            onAddSpendTransaction={handleAddSpendTransaction} />
        </>
      ) : (
        <SpendTransactionHistory />
      )}
    </div>
  );
};

export default SpendOptimizer;
