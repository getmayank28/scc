import { useMemo, useState } from "react";
import { CustomAreaChart } from "@/components/Navigation/AreaChart/AreaChart";
import DataCard from "@/components/DataCard/DataCard";
import { IndianRupee, Newspaper, QrCode } from "lucide-react";
import { SpendProps } from "../../types";
import { calculateRewards } from "../../logic";
import Typography from "@/components/Typography/Typography";

interface Step2Props {
  spends: SpendProps;
}

type RewardTypes =
  | "billReward"
  | "onlineShoppingReward"
  | "offlineSpendReward"
  | "totalReward";

const Step2 = ({ spends }: Step2Props) => {
  const [selectedRewardCard, setselectedRewardCard] =
    useState<RewardTypes>("billReward");

  const rewards = calculateRewards(spends);
  const rewardsChartData = {
    billReward: {
      color: "#946BF5",
      backgroundColor: "#E8E1FD",
      data: [
        { x: "", one: 0, two: 0 },
        { x: "", one: rewards?.billReward, two: 0 },
      ],
    },
    onlineShoppingReward: {
      color: "#FEA02C",
      backgroundColor: "#FFECD4",
      data: [
        { x: "", one: 0, two: 0 },
        { x: "", one: rewards?.onlineShoppingReward, two: 0 },
      ],
    },
    offlineSpendReward: {
      color: "#FB6BA7",
      backgroundColor: "#FEE1EE",
      data: [
        { x: "", one: 0, two: 0 },
        { x: "", one: rewards?.offlineSpendReward, two: 0 },
      ],
    },
    totalReward: {
      color: "#2FA5FF",
      backgroundColor: "#D6EDFF",
      data: [
        { x: "", one: 0, two: 0 },
        { x: "", one: rewards?.totalReward, two: 0 },
      ],
    },
  };

  // const totalSpend = useMemo(() => {
  //   return (
  //     spends.offlineSpend + spends.onlineBillPayment + spends.onlineShopping
  //   );
  // }, [spends]);

  const items = [
    {
      value: "billReward",
      icon: Newspaper,
      title: "Bill Payments",
      description: `Yearly Savings: --INR ${(rewards?.billReward * 12)?.toFixed(0)}`,
      progressPercentage:
        (rewards?.billReward / spends?.onlineBillPayment) * 100 * 12,
      color: "bg-[#946BF5]",
      backgroundColor: "bg-[#E8E1FD]",
    },
    {
      value: "onlineShoppingReward",
      icon: QrCode,
      title: "Online Shopping",
      description: `Yearly Savings: --INR ${(rewards?.onlineShoppingReward * 12)?.toFixed(0)}`,
      progressPercentage:
        (rewards?.onlineShoppingReward / spends?.onlineShopping) * 100 * 12,
      color: "bg-[#FEA02C]",
      backgroundColor: "bg-[#FFECD4]",
    },
    {
      value: "offlineSpendReward",
      icon: IndianRupee,
      title: "Offline Spends",
      description: `Yearly Savings: --INR ${(rewards?.offlineSpendReward * 12)?.toFixed(0)}`,
      progressPercentage:
        (rewards?.offlineSpendReward / spends?.offlineSpend) * 100 * 12,
      color: "bg-[#FB6BA7]",
      backgroundColor: "bg-[#FEE1EE]",
    },
    // {
    //   value: "totalReward",
    //   icon: HandCoins,
    //   title: "Total Spends",
    //   description: `Yearly Savings: --INR ${(rewards?.totalReward * 12)?.toFixed(0)}`,
    //   progressPercentage: (rewards?.totalReward / totalSpend) * 100 * 12,
    //   color: "bg-[#2FA5FF]",
    //   backgroundColor: "bg-[#D6EDFF]",
    // },
  ];
  return (
    <div className="flex flex-col gap-4 mt-10">
      <Typography variant="h4" className="text-left">
        Rewards you are missing on!
      </Typography>
      <div className="flex py-5 px-10 rounded-lg gap-12">
        <div className="w-[1800px]">
          <CustomAreaChart chartData={rewardsChartData?.[selectedRewardCard]} />
        </div>
        <div className="p-0 flex flex-col gap-8">
          <div>
            <Typography variant="h5" className="text-left">
              Total saving with card vs without card
            </Typography>
            <Typography variant="h4" className="text-left mt-2">
              <span className="text-green-500  font-bold">
                INR {(rewards?.totalReward*12)?.toLocaleString("en-IN")}
              </span>{" "}
              VS <span className="text-red-600 font-bold">INR 0</span>
            </Typography>
          </div>
          <div className="flex flex-wrap gap-6">
            {items?.map((card) => (
              <DataCard
                isActive={selectedRewardCard === card?.value}
                onClick={() =>
                  setselectedRewardCard(card?.value as RewardTypes)
                }
                key={card.title}
                icon={card.icon}
                title={card.title}
                description={card.description}
                progressPercentage={card.progressPercentage}
                color={card.color}
                backgroundColor={card.backgroundColor}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step2;
