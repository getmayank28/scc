import { SpendOptimizerCreditCardSkeleton } from "@/components/Loader/Loader";
import Typography from "@/components/Typography/Typography";
import { Checkbox } from "@/components/ui/checkbox";
import useNav from "@/lib/hooks/useNav";
import { CreditCard } from "@/types/card";
import { CirclePlus } from "lucide-react";
import Image from "next/image";

interface UserCards {
  cards: CreditCard[];
  userCards: string[];
  isCardsLoading: boolean;
  setUserCards: (cards: string[]) => void;
}

const UserCards = ({
  cards,
  userCards,
  isCardsLoading,
  setUserCards,
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
                    className={`shrink-0  flex flex-col cursor-pointer p-3 px-4 max-md:px-2 gap-1 rounded-sm items-start justify-between h-[160px] w-[260px] max-md:w-[300px] border ${userCards?.includes(card?._id) ? "border-primary-orange bg-[linear-gradient(70deg,#30251E_80%,#6F4D34_100%,#AD744A_100%)]" : "bg-secondary-gray/30 border-white/30"}`}
                    onClick={() => {
                      const isSelected = userCards?.includes(card?._id);
                      if (isSelected) {
                        const filteredOptions = userCards?.filter(
                          (option) => option !== card?._id
                        );
                        setUserCards(filteredOptions);
                      } else {
                        // @ts-expect-error this is correct
                        setUserCards((prev) => [...prev, card?._id]);
                      }
                    }}
                  >
                    <div className="flex flex-col items-start gap-2">
                      <div
                        className={`${userCards?.includes(card?._id) ? "bg-primary-orange/15" : "bg-white/20"} rounded-sm p-2 max-md:py-2 max-md:px-3`}
                      >
                        <Image
                          width={20}
                          height={20}
                          src="/logos/hdfc.png"
                          alt="bank-logo"
                        />
                      </div>
                      <div className="flex flex-col gap-1 items-start">
                        <Typography
                          variant="caption"
                          className="text-sm opacity-100 font-semibold"
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
              className="border cursor-pointer px-3 flex flex-col items-center justify-center gap-2 border-dashed border-white/60 rounded-lg h-[160px] w-[260px]"
              onClick={navigateToProfile}
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
