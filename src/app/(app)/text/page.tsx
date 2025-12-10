import Typography from "@/components/Typography/Typography";
import { Button } from "@/components/ui/button";
import React from "react";

const cards = [
  {
    card: "IDFC FIRST Bank Millennia",
    annualSavings: "₹11,300",
    roi: "1.88%",
    bestFor: "High online spend across various categories",
    whyThisCard:
      "Offers excellent rewards (3X-10X) on most online spending, including travel, food, utilities, and online shopping. Lifetime free!",
    annualFee: "₹0",
    applyLink: "https://tinyurl.com/yk8h98ne",
  },
  {
    card: "Axis Bank Privilege Credit Card",
    annualSavings: "₹8,100",
    roi: "1.35%",
    bestFor: "Milestone rewards, lounge access, dining",
    whyThisCard:
      "Earns good rewards on travel, dining, and online shopping, plus attractive welcome and milestone benefits. Fee waived on high spend.",
    annualFee: "₹1,500 ",
    applyLink: "https://tinyurl.com/57t9dr2b",
  },
  {
    card: "ACE Credit Card (Axis Bank)",
    annualSavings: "₹6,600",
    roi: "1.1%",
    bestFor: "Utility bills, food delivery, online shopping",
    whyThisCard:
      "Provides strong cashback on utilities, Zomato, and Flipkart, maximizing savings on your key expenses. Fee waived on high spend.",
    annualFee: "₹499",
    applyLink: "https://tinyurl.com/57t9dr2b",
  },
];

const bankIcon = (
  <svg
    width="15"
    height="15"
    viewBox="0 0 15 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M0 0C4.95 0 9.9 0 15 0C15 4.95 15 9.9 15 15C10.05 15 5.1 15 0 15C0 10.05 0 5.1 0 0ZM1.20094 1.20743C1.20094 5.36053 1.20094 9.51362 1.20094 13.7926C5.35832 13.7926 9.5157 13.7926 13.7991 13.7926C13.7991 9.63947 13.7991 5.48638 13.7991 1.20743C9.64168 1.20743 5.4843 1.20743 1.20094 1.20743Z"
      fill="white"
      fill-opacity="0.9"
    />
    <path
      d="M2.49609 2.53125C5.79091 2.53125 9.08573 2.53125 12.4804 2.53125C12.4804 3.35114 12.4804 4.17103 12.4804 5.01577C9.18558 5.01577 5.89076 5.01577 2.49609 5.01577C2.49609 4.19588 2.49609 3.37599 2.49609 2.53125Z"
      fill="white"
      fill-opacity="0.9"
    />
    <path
      d="M2.49609 6.24805C4.55536 6.24805 6.61462 6.24805 8.73628 6.24805C8.73628 7.0756 8.73628 7.90316 8.73628 8.75579C6.67702 8.75579 4.61776 8.75579 2.49609 8.75579C2.49609 7.92823 2.49609 7.10068 2.49609 6.24805Z"
      fill="white"
      fill-opacity="0.9"
    />
    <path
      d="M2.49609 9.98242C3.32757 9.98242 4.15905 9.98242 5.01572 9.98242C5.01572 10.8023 5.01572 11.6222 5.01572 12.4669C4.18424 12.4669 3.35277 12.4669 2.49609 12.4669C2.49609 11.6471 2.49609 10.8272 2.49609 9.98242Z"
      fill="white"
      fill-opacity="0.9"
    />
  </svg>
);

interface CardProps {
  card: string;
  annualSavings: string;
  roi: string;
  annualFee: string;
  bankIcon?: React.ReactNode;
  applyLink: string;
  pattern?:number;
}

const Card = ({
  card,
  annualSavings,
  roi,
  annualFee,
  bankIcon,
  applyLink,
  pattern
}: CardProps) => {
  return (
    <div className="w-[230px]  h-[350px] shadow-[0_15px_40px_rgba(0,0,0,0.7)] overflow-visible bg-background-primary border border-white/20 rounded-lg relative"
 >
      <img
        src={`/images/pattern${pattern+1}.png`}
        className="w-[230px] h-[350px] rounded-lg opacity-10"
        alt="card"
        draggable="false"
      />

      <div className="absolute w-full top-0 left-0 h-full p-3 pt-5 pb-3 flex flex-col justify-between">
        <div className="flex gap-1 items-center">
         { <p>{bankIcon}</p>}
          <Typography variant="p" className="font-bold">{card}</Typography>
        </div>

        <div className="flex flex-col gap-2">
          <Typography
            variant="p"
            className="uppercase text-left text-primary-orange/80 font-bold tracking-[2px]"
          >
            Key points
          </Typography>

          <div className="w-full">
            <Typography variant="h4" className="text-left opacity-70">
              {annualSavings}
            </Typography>
            <Typography variant="p" className="text-left pl-10 opacity-90">
              Annual Savings
            </Typography>
          </div>

          <div className="w-full">
            <Typography variant="h4" className="text-left opacity-70">
              {annualFee}
            </Typography>
            <Typography variant="p" className="text-left pl-10 opacity-90">
              Annual Fee
            </Typography>
          </div>

          <div className="w-full">
            <Typography variant="h4" className="text-left opacity-70">
              {roi}
            </Typography>
            <Typography variant="p" className="text-left pl-10 opacity-90">
              ROI
            </Typography>
          </div>
        </div>

        <div className="flex gap-2">
          <button className="text-white w-full border border-primary-orange/70 rounded-full text-[12px] py-1 p-2 cursor-pointer">
            Why this?
          </button>

          <a
            href={applyLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white min-w-[80px] w-full font-bold bg-primary-orange/80 border border-secondary-orange rounded-full text-[12px] py-1 p-2 cursor-pointer text-center"
          >
            Apply now
          </a>
        </div>
      </div>
    </div>
  );
};

export default function CreditCardGrid() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-10 bg-background-primary h-screen">
      <h2 className="text-3xl font-bold text-center mb-8">
        Top Credit Card Recommendations
      </h2>
      <div className="flex gap-6">
        {cards.map((item, index) => (
          <Card key={index} {...item} pattern={index}  bankIcon={bankIcon} />
        ))}
      </div>
    </div>
  );
}
