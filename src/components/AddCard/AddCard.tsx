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
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

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

  // Rows whose card was deleted from the catalogue come back with a null
  // cardId; there's nothing to draw for them.
  const cards = (userCards ?? []).filter(
    (c: { cardId?: unknown }) => c?.cardId,
  );

  // Phones: cards swipe sideways, with dots for position.
  const rowRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const onRowScroll = () => {
    const el = rowRef.current;
    const first = el?.firstElementChild as HTMLElement | null;
    if (!el || !first) return;
    setActive(Math.min(cards.length - 1, Math.round(el.scrollLeft / (first.offsetWidth + 12))));
  };
  const goTo = (i: number) => {
    const el = rowRef.current;
    const slide = el?.children[i] as HTMLElement | undefined;
    const first = el?.children[0] as HTMLElement | undefined;
    if (el && slide && first) el.scrollTo({ left: slide.offsetLeft - first.offsetLeft, behavior: "smooth" });
  };

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

      <div
        ref={rowRef}
        onScroll={onRowScroll}
        className="flex gap-5 flex-wrap py-6 max-md:-mx-4 max-md:flex-nowrap max-md:gap-3 max-md:overflow-x-auto max-md:overscroll-x-contain max-md:snap-x max-md:snap-mandatory max-md:scroll-px-4 max-md:px-4 max-md:pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-md:[&>*]:shrink-0 max-md:[&>*]:snap-start"
      >
        {isCardsLoading ? (
          <>
            <CreditCardSkeleton />
            <CreditCardSkeleton />
            <CreditCardSkeleton />
          </>
        ) : (
          cards.map(
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

      {!isCardsLoading && cards.length > 1 && (
        <div className="hidden justify-center gap-1.5 max-md:flex" role="tablist" aria-label="Your cards">
          {cards.map((c: { _id: string }, i: number) => (
            <button
              key={c._id}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`${i + 1} of ${cards.length}`}
              onClick={() => goTo(i)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === active ? "w-[18px] bg-primary-orange" : "w-1.5 bg-white/25",
              )}
            />
          ))}
        </div>
      )}

      {!cards.length && !isCardsLoading && (
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
