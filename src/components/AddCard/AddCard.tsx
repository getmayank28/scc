"use client";
import { CreditCard } from "@/components/CreditCard";
import HeaderText from "@/components/HeaderText/HeaderText";
import CreditCardSkeleton from "@/components/SkeletonLoader/CreditCardSkeletonLoader";
import Typography from "@/components/Typography/Typography";
import { bankIcon } from "@/lib/data/banks";
import useUserData from "@/lib/hooks/useUserData";
import { useGetUserCardsQuery, useRemoveUserCardMutation } from "@/store/api";
import { useAddCardModal } from "@/contexts/AddCardContext";
import { CirclePlus, Plus } from "lucide-react";

const AddCardButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <div
      onClick={onClick}
      className="flex flex-col cursor-pointer rounded-lg justify-center items-center w-[330px] h-[180px] border border-dashed border-white/60 hover:bg-secondary-orange/30 hover:border-primary-orange"
    >
      <CirclePlus className="text-[#A0A0A0] w-20 h-20" />
      <Typography variant="caption">Add card</Typography>
    </div>
  );
};

const AddCards = () => {
  const { userId, name } = useUserData();
  const { openAddCard } = useAddCardModal();

  const { data: userCards, isFetching: isCardsLoading } = useGetUserCardsQuery(
    { userId },
    {
      skip: !userId,
    },
  );

  const [removeUserCard] = useRemoveUserCardMutation();

  const handleCardRemove = async (cardId: string) => {
    await removeUserCard({
      userId,
      cardId,
    });
  };

  const handleAddCard = () => openAddCard("profile");

  return (
    <div className="flex flex-col mt-3">
      <button
        type="button"
        onClick={handleAddCard}
        className="inline-flex w-fit items-center gap-2 rounded-lg bg-primary-orange px-4 py-2.5 text-sm font-semibold text-white hover:brightness-110 cursor-pointer"
      >
        <Plus className="size-4" aria-hidden />
        Add a card
      </button>

      <div className="flex gap-5 flex-wrap py-6">
        {isCardsLoading ? (
          <>
            <CreditCardSkeleton />
            <CreditCardSkeleton />
            <CreditCardSkeleton />
          </>
        ) : (
          userCards?.map(
            (card: {
              _id: string;
              cardId: { name: string; _id: string; bankName: string };
            }) => (
              <CreditCard
                compact
                removeImage
                background="linear-gradient(135deg,#30251E 60%,#6F4D34 100%,#AD744A 100%)"
                key={card?._id}
                isCardSpotlightActive={false}
                cardName={card?.cardId?.name}
                bankLogo={
                  bankIcon?.[card?.cardId?.bankName] ?? bankIcon?.default
                }
                name={name || "Card Holder"}
                onRemove={() => handleCardRemove(card?.cardId?._id)}
              />
            ),
          )
        )}
      </div>

      {!userCards?.length && !isCardsLoading && (
        <div className="flex flex-col items-start gap-2">
          <HeaderText
            title="Oh no! No cards yet"
            titleVariant="h5"
            titleClassName="font-bold text-left"
          />
          <AddCardButton onClick={handleAddCard} />
        </div>
      )}
    </div>
  );
};

export default AddCards;
