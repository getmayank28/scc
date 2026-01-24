import Typography from "@/components/Typography/Typography"
import { Button } from "@/components/ui/button"
import TopPerformingCard from "./TopPerformingCard"

const TopPerformingCardSection = () => {
    return(
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
       <TopPerformingCard/>
       <TopPerformingCard/>
       </div>
      </div>
    )
}

export default TopPerformingCardSection