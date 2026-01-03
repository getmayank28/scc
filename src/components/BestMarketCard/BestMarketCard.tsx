import useNav from "@/lib/hooks/useNav";
import HeaderText from "../HeaderText/HeaderText";
import Typography from "../Typography/Typography";
import { Button } from "../ui/button";

import { CreditCard, Globe, ShieldCheck } from "lucide-react";
import InfoCard from "../InfoCard/InfoCard";

 
const BestMarketCard = () => {
  const { goToCardCategory } = useNav();

  const infoCardData = [
    {
      icon: <CreditCard />,
      iconLabel: "Limited",
      title: "Best Card with Zero Forex Mark-up",
      subtitle: "Ideal for international travel & foreign online spends",
      chips: ["0 Forex", "Best ROI", "Great Return"],
      buttonLabel: "View all options",
      onClick: goToCardCategory,
    },
    {
      icon: <Globe />,
      iconLabel: "Popular",
      title: "Travel Card with Lounge Access",
      subtitle: "Complimentary airport lounges worldwide",
      chips: ["Lounge Access", "Travel Rewards", "Low Fees"],
      buttonLabel: "Explore cards",
      onClick: goToCardCategory,
    },
    {
      icon: <ShieldCheck />,
      iconLabel: "Secure",
      title: "Premium Card with Fraud Protection",
      subtitle: "Advanced security for all transactions",
      chips: ["Fraud Shield", "Instant Alerts", "24x7 Support"],
      buttonLabel: "See details",
      onClick: goToCardCategory,
    },
  ];
  
  return (
    <div className="py-12">
      <HeaderText title="Explore top cards in the market" content="" />
      <div className="flex items-center justify-center">
        <Typography variant="caption" className="-mr-2">
          To know what fits you best
        </Typography>
        <Button variant="link" onClick={goToCardCategory}>
          Ask the agent →
        </Button>
      </div>
      <div className="flex gap-6 mt-10">
        {infoCardData?.map((card) => (
          <InfoCard key={card.title} {...card} />
        ))}
      </div>
    </div>
  );
};

export default BestMarketCard;
