import Typography from "@/components/Typography/Typography";
import { calculateRewardsSpendRatio, formatNumber } from "@/lib/utils/number";
import { BanknoteArrowDown, BanknoteArrowUp, IndianRupee, ListTodo } from "lucide-react";
import { useMemo } from "react";

const StatsCard = ({
  amount,
  title,
  icon,
}: {
  amount: string;
  title: string;
  icon: React.ReactNode;
}) => (
  <div className="w-40 h-30 border-b-6 border-brown-border flex flex-col justify-between bg-brown-background p-3 rounded-lg">
    <div className="flex justify-between items-start">
      {icon}

      <Typography variant="h3" className="text-left text-primary-orange">
        {amount}
      </Typography>
    </div>
    <Typography
      variant="caption"
      className="text-[12px] capitalize opacity-100 text-secondary-gray font-semibold"
    >
      {title}
    </Typography>
  </div>
);

interface StatsProp {
  totalAmountSpent: number;
  totalRewardsEarned: number;
  totalSpendOptimized: number;
}

const StatsSection = ({ spendAnalytics }: {
  spendAnalytics: StatsProp
}) => {
  const rewardsSpendRatio = useMemo(
    () =>
      calculateRewardsSpendRatio(
        spendAnalytics?.totalRewardsEarned,
        spendAnalytics?.totalAmountSpent
      ),
    [spendAnalytics?.totalRewardsEarned, spendAnalytics?.totalAmountSpent]
  );

  return (
    <div className="bg-brown-sidebar p-4 px-6 rounded-xl grid grid-cols-2 gap-4 min-h-[292px]">
      <StatsCard
        title="Total amount spend"
        amount={formatNumber(spendAnalytics?.totalAmountSpent)}
        icon={<BanknoteArrowUp size={24} className="text-secondary-gray mt-2" />}
      />
      <StatsCard
        title="Total rewards earn"
        amount={formatNumber(spendAnalytics?.totalRewardsEarned)}
        icon={<BanknoteArrowDown size={24} className="text-secondary-gray mt-2" />}
      />
      <StatsCard
        title="Rewards/Spend (%)"
        amount={`${rewardsSpendRatio}%`}
        icon={<IndianRupee size={24} className="text-secondary-gray mt-2" />}
      />
      <StatsCard
        title="Total spend optimized"
        amount={formatNumber(spendAnalytics?.totalSpendOptimized)}
        icon={<ListTodo size={24} className="text-secondary-gray mt-2" />}
      />
    </div>
  );
};

export default StatsSection;
