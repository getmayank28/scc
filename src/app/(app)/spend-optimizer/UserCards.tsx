import { SpendOptimizerCreditCardSkeleton } from "@/components/Loader/Loader";
import Typography from "@/components/Typography/Typography";
import { Checkbox } from "@/components/ui/checkbox";
import useNav from "@/lib/hooks/useNav";
import useUserData from "@/lib/hooks/useUserData";
import { useGetUserCardsQuery } from "@/store/api";
import { CirclePlus } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

const UserCards = () => {
  const [userCards, setUserCards] = useState<Array<string>>([]);
  const { userId } = useUserData();
  const { data: cards, isFetching: isCardsLoading } = useGetUserCardsQuery({
    userId,
  });
  const { navigateToProfile } = useNav();

  useEffect(() => {
    if (cards) {
      const cardIds = cards?.map((card: { _id: string }) => card?._id);
      setUserCards(cardIds);
    }
  }, [cards]);

  return (
    <div className="pt-8">
      <Typography variant="body" className="font-bold opacity-90 text-left">
        Your cards
      </Typography>
      {cards?.length || isCardsLoading ? (
        <div className="flex gap-6 py-2 overflow-x-auto whitespace-nowrap">
          {isCardsLoading ? (
            <>
              <SpendOptimizerCreditCardSkeleton />
              <SpendOptimizerCreditCardSkeleton />
            </>
          ) : (
            cards?.map((card: { _id: string; cardId: { name: string, bankName:string } }) => {
              return (
                <div
                key={card?._id}
                className={`shrink-0 flex cursor-pointer p-3 px-4 max-md:px-2 gap-3 rounded-sm items-center justify-between w-[430px] max-md:w-[300px] border ${userCards?.includes(card?._id) ? "border-primary-orange" : "bg-white/5 border-white/30"}`}
                onClick={() => {
                  const isSelected = userCards?.includes(card?._id);
                  if (isSelected) {
                    const filteredOptions = userCards?.filter(
                      (option) => option !== card?._id
                    );
                    setUserCards(filteredOptions);
                  } else {
                    setUserCards((prev) => [...prev, card?._id]);
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  <div className={`${userCards?.includes(card?._id) ?'bg-primary-orange/15':'bg-white/20'} rounded-sm p-3 px-4 max-md:py-2 max-md:px-3`}>
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
                      className="text-md opacity-90 font-semibold"
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
                <Checkbox
                  checked={userCards?.includes(card?._id)}
                  className="w-6 h-6 data-[state=checked]:border-secondary-orange border-secondary-orange data-[state=checked]:bg-secondary-orange data-[state=checked]:text-white"
                />
              </div>
              );
            })
          )}
        </div>
      ) : (
        <div
          className="border cursor-pointer px-3 flex justify-start items-center gap-2 mt-2 border-dashed border-white/60 rounded-lg h-12 w-[430px]"
          onClick={navigateToProfile}
        >
          <CirclePlus className="text-white/60" size={25} />
          <Typography variant="caption" className="font-semibold">
            Add card to start optimizing your spend
          </Typography>
        </div>
      )}
    </div>
  );
};

export default UserCards;
