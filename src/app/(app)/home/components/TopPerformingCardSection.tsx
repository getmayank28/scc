import Typography from "@/components/Typography/Typography"
import { Button } from "@/components/ui/button"
import TopPerformingCard from "./TopPerformingCard"
import { calculateRewardsSpendRatio, formatNumber } from "@/lib/utils/number";

export interface TopCard {
  cardName: string;
  cardSpend: number;
  cardRewards: number;
  cardKey: string;
}

const TopPerformingCardSection = ({ topCards }: { topCards: TopCard[] }) => {
  return (
    <div className="w-sm bg-brown-sidebar p-4 px-6 rounded-xl min-h-[292px]">
      <div className="flex justify-between items-center mb-2">
        <Typography
          variant="caption"
          className="font-bold opacity-100 text-secondary-gray"
        >
          Top Performing Card
        </Typography>
        <Button
          variant="ghost"
          className="cursor-pointer hover:bg-transparent hover:text-white p-0 text-primary-orange opacity-100 font-bold"
        >
          Manage Cards
        </Button>
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