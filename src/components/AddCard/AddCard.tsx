"use client";
import { CreditCard } from "@/components/CreditCard";
import HeaderText from "@/components/HeaderText/HeaderText";
import SearchSelect from "@/components/SearchInput/SearchInput";
import CreditCardSkeleton from "@/components/SkeletonLoader/CreditCardSkeletonLoader";
import Typography from "@/components/Typography/Typography";
import { Button } from "@/components/ui/button";
import useUserData from "@/lib/hooks/useUserData";
import {
  useAddCardMutation,
  useGetUserCardsQuery,
  useRemoveUserCardMutation,
} from "@/store/api";
import { CirclePlus, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import toast from "react-hot-toast";

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
  const [selected, setSelected] = useState<{
    _id: string;
    name: string;
    bankName: string;
  } | null>(null);
  const [query, setQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const { userId, name } = useUserData();

  const [addCard, { isLoading: isAddingCard }] = useAddCardMutation();

  const { data: userCards, isFetching: isCardsLoading } = useGetUserCardsQuery(
    { userId },
    {
      skip: !userId,
    }
  );

  const [removeUserCard] = useRemoveUserCardMutation();

  const handleSubmit = async () => {
    const body = {
      userId,
      cardId: selected?._id,
    };
    try {
      await addCard(body).unwrap();
      toast.success("Card added successfully");
    } catch {
      toast.error("Failed to add card");
    }

    setSelected(null);
    setQuery("");
  };

  const handleCardRemove = async (cardId: string) => {
    await removeUserCard({
      userId,
      cardId,
    });
  };

  const handleAddCard = () => {
    if (searchInputRef.current) searchInputRef.current.focus();
  };

  return (
    <div className="flex flex-col mt-3">
      <div className="flex gap-2">
        <SearchSelect
          searchInputRef={searchInputRef}
          query={query}
          setQuery={setQuery}
          selected={selected}
          setSelected={setSelected}
          onClearInput={()=> {
            setQuery('')
            setSelected(null)
          }}
        />
        <Button
          disabled={!selected?.name || isAddingCard}
          className="rounded-full h-12 px-8 max-md:px-4"
          onClick={handleSubmit}
        >
          {isAddingCard && (
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          )}
          Add Card
        </Button>
      </div>

      <div className="flex gap-5 flex-wrap py-6">
        {isCardsLoading ? (
          <>
            <CreditCardSkeleton />
            <CreditCardSkeleton />
            <CreditCardSkeleton />
          </>
        ) : (
          userCards?.map(
            (card: { _id: string; cardId: { name: string; _id: string } }) => (
              <CreditCard
              removeImage
                background="linear-gradient(135deg,#30251E 60%,#6F4D34 100%,#AD744A 100%)"
                key={card?._id}
                isCardSpotlightActive={false}
                cardName={card?.cardId?.name}
                name={name || ""}
                onRemove={() => handleCardRemove(card?.cardId?._id)}
              />
            )
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
