import Typography from "@/components/Typography/Typography"
import TopPerformingCard from "./TopPerformingCard"
import { calculateRewardsSpendRatio, formatNumber } from "@/lib/utils/number";
import { TopPerformingCardSectionSkeleton } from "@/components/Loader/Loader";

export interface TopCard {
  cardName: string;
  cardSpend: number;
  cardRewards: number;
  cardKey: string;
}

const TopPerformingCardSection = ({ topCards, isLoading }: { topCards: TopCard[], isLoading:boolean }) => {

  if(isLoading){
    return <TopPerformingCardSectionSkeleton/>
  }
 
  return (
    <div className="w-sm bg-brown-sidebar p-4 px-6 rounded-xl min-h-[292px] max-md:p-4 max-md:w-full max-md:min-h-fit">
      <div className="flex justify-between items-center mb-2">
        <Typography
          variant="caption"
          className="font-bold opacity-100 text-secondary-gray"
        >
          Your Top Performing Card
        </Typography>
      </div>
      <div className="flex flex-col gap-2 justify-between">
        {
          topCards?.map((card) => (
            <TopPerformingCard 
              key={card?.cardKey}
              spend={formatNumber(card?.cardSpend)}
              reward={formatNumber(card?.cardRewards)}
              name={card?.cardName}
              percentage={calculateRewardsSpendRatio(
                card?.cardRewards,
                card?.cardSpend
              )}

            />
          ))
        }

      </div>
    </div>
  )
}

export default TopPerformingCardSection