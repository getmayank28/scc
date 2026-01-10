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
    <div className="pt-8 max-md:overflow-x-auto">
      <Typography variant="body" className="font-bold opacity-90 text-left">
        Your cards
      </Typography>
      {cards?.length || isCardsLoading ? (
        <div className="flex gap-6 py-2 w-[754px] max-md:!overflow-x-auto">
          {isCardsLoading ? (
            <>
              <SpendOptimizerCreditCardSkeleton />
              <SpendOptimizerCreditCardSkeleton />
            </>
          ) : (
            cards?.map((card: { _id: string; cardId: { name: string } }) => {
              return (
                <div
                  key={card?._id}
                  className={`flex p-3 px-4 rounded-sm items-center justify-between w-[430px] max-md:w-[327px] border ${userCards?.includes(card?._id) ? "border-secondary-orange" : "border-white/30"}`}
                >
                  <div className="flex items-center gap-3">
                    <Image
                      width={25}
                      height={25}
                      src="/logos/hdfc.png"
                      alt="bank-logo"
                    />
                    <Typography
                      variant="caption"
                      className="text-sm font-semibold"
                    >
                      {card?.cardId?.name}
                    </Typography>
                  </div>
                  <Checkbox
                    checked={userCards?.includes(card?._id)}
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
