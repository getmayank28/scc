import { SpendOptimizerCreditCardSkeleton } from "@/components/Loader/Loader";
import Typography from "@/components/Typography/Typography";
import { Checkbox } from "@/components/ui/checkbox";
import { bankIcon } from "@/lib/data/banks";
import useNav from "@/lib/hooks/useNav";
import { CreditCard } from "@/types/card";
import { CirclePlus } from "lucide-react";
import Image from "next/image";
import { EventName, EventPropertiesMap } from "@/lib/analytics/types";

interface UserCards {
  cards: CreditCard[];
  userCards: string[];
  isCardsLoading: boolean;
  setUserCards: (cards: string[]) => void;
  track: <T extends EventName>(eventName: T, properties: EventPropertiesMap[T]) => void;
}

const UserCards = ({
  cards,
  userCards,
  isCardsLoading,
  setUserCards,
  track,
}: UserCards) => {
  const { navigateToProfile } = useNav();

  return (
    <div className="pt-8">
      <div className="flex gap-2 items-center">
        <div
          className={`rounded-lg flex justify-center items-center text-xl h-9 w-9 border-2 bg-[#FFE0EA] text-[#FF6496] border-[#FF6496] font-bold uppercas`}
        >
          01
        </div>
        <Typography variant="body" className="font-bold opacity-100 text-left">
          Select Your Cards
        </Typography>
      </div>
      <div className="flex gap-6 overflow-x-auto whitespace-nowrap pt-4">
        {isCardsLoading ? (
          <>
            <SpendOptimizerCreditCardSkeleton />
            <SpendOptimizerCreditCardSkeleton />
            <SpendOptimizerCreditCardSkeleton />
          </>
        ) : (
          <>
            {cards?.map(
              (card: {
                _id: string;
                cardId: { name: string; bankName: string };
              }) => {
                return (
                  <div
                    key={card?._id}
                    className={`shrink-0  flex flex-col cursor-pointer p-3 px-4 max-md:px-2 gap-1 rounded-sm items-start justify-between h-[160px] w-[260px] max-md:w-[260px] border ${userCards?.includes(card?._id) ? "border-primary-orange bg-[linear-gradient(70deg,#30251E_80%,#6F4D34_100%,#AD744A_100%)]" : "bg-secondary-gray/30 border-white/30"}`}
                    onClick={() => {
                      const isSelected = userCards?.includes(card?._id);
                      if (isSelected) {
                        const filteredOptions = userCards?.filter(
                          (option) => option !== card?._id
                        );
                        setUserCards(filteredOptions);
                        track(EventName.SPEND_OPTIMIZER_CARD_DESELECTED, {
                          cardId: card?._id,
                          cardName: card?.cardId?.name,
                          bankName: card?.cardId?.bankName,
                          selectedCardCount: filteredOptions.length,
                        });
                      } else {
                        // @ts-expect-error this is correct
                        setUserCards((prev) => [...prev, card?._id]);
                        track(EventName.SPEND_OPTIMIZER_CARD_SELECTED, {
                          cardId: card?._id,
                          cardName: card?.cardId?.name,
                          bankName: card?.cardId?.bankName,
                          selectedCardCount: userCards.length + 1,
                        });
                      }
                    }}
                  >
                    <div className="flex flex-col items-start gap-2">
                    <Image
                          width={20}
                          height={20}
                          src={`/icons/banks/${bankIcon?.[card?.cardId?.bankName] ?? bankIcon?.default}`}
                          alt="bank-logo"
                        />
                      <div className="flex flex-col gap-1 items-start">
                        <Typography
                          variant="caption"
                          className="text-sm text-left opacity-100 font-semibold whitespace-normal"
                        >
                          {card?.cardId?.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          className="text-xs opacity-80 font-semibold"
                        >
                          {card?.cardId?.bankName}
                        </Typography>
                      </div>
                    </div>
                    <div className="flex justify-between items-end w-full border-t border-white/30 pt-2">
                      <Typography
                        variant="caption"
                        className="text-sm capitalize font-semibold"
                      >
                        {userCards?.includes(card?._id)
                          ? "Selected"
                          : "Unselected"}
                      </Typography>
                      <Checkbox
                        checked={userCards?.includes(card?._id)}
                        className="w-6 h-6 data-[state=checked]:border-secondary-orange border-primary-orange data-[state=checked]:bg-primary-orange data-[state=checked]:text-white"
                      />
                    </div>
                  </div>
                );
              }
            )}
            <div
              className="border cursor-pointer px-3 flex flex-col items-center justify-center gap-2 border-dashed border-white/60 rounded-lg h-[160px] !w-[260px] max-md:!w-[260px]"
              onClick={() => {
                track(EventName.SPEND_OPTIMIZER_ADD_CARD_CLICKED, {});
                navigateToProfile();
              }}
            >
              <CirclePlus className="text-white/60" size={60} />
              <Typography
                variant="caption"
                className="font-semibold uppercase tracking-wider"
              >
                Add card
              </Typography>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserCards;
