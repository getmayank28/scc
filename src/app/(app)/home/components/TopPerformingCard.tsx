import Typography from "@/components/Typography/Typography"

interface TopPerformingCardProps {
  spend: string;
  reward: string;
  percentage: number;
  name: string;
}

const TopPerformingCard = ({ spend, reward, percentage, name }:TopPerformingCardProps) => {
  return (
    <div className="bg-brown-background p-2 rounded-md px-4">
      <div className="flex justify-between">
        <div>
          <Typography
            variant="body"
            className="text-left opacity-100 font-semibold text-primary-orange"
          >
            {spend}
          </Typography>
          <Typography
            variant="caption"
            className="text-sm text-left opacity-80 font-medium capitalize"
          >
            spend
          </Typography>
        </div>
        <div>
          <Typography
            variant="body"
            className="text-left opacity-100 font-semibold text-primary-orange"
          >
           {reward}
          </Typography>
          <Typography
            variant="caption"
            className="text-sm text-left opacity-80 font-medium capitalize"
          >
            rewards
          </Typography>
        </div>
        <div>
          <Typography
            variant="body"
            className="text-right opacity-100 font-semibold text-primary-orange"
          >
            {percentage}%
          </Typography>
          <Typography
            variant="caption"
            className="text-sm text-right opacity-80 font-medium capitalize"
          >
            spend/rewards
          </Typography>
        </div>
      </div>
      <Typography
        variant="caption"
        className="text-left border-t border-white/10 text-secondary-gray opacity-100 font-semibold  mt-2 pt-1"
      >
      {name}
      </Typography>
    </div>
  )
}

export default TopPerformingCard