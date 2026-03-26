"use client"
import Typography from "@/components/Typography/Typography";
import { LayoutTextFlip } from "@/components/ui/layout-text-flip";
import Image, { StaticImageData } from "next/image";
import { NotificationCardV2 } from "./Hero";
import Boy from "../../../../public/images/boy.png";
import Girl from "../../../../public/images/girl.png";
import Boy2 from "../../../../public/images/boy2.png";
import Girl2 from "../../../../public/images/girl2.png";
import { Button } from "@/components/ui/stateful-button";
import useLandingCTAs from "@/lib/hooks/useLandingCTAs";
import { trackEvent } from "@/lib/analytics/track";
import { EventName } from "@/lib/analytics/types";

const TheWrongCardRightContent = ({
  message,
  card,
  img,
  color,
  cardImg,
}: {
  message: string;
  card: string;
  img: string;
  color: string;
  cardImg: StaticImageData;
}) => {
  return (
    <div className="w-[450px] relative flex flex-col justify-center items-center z-10">
      <div className="w-[390px] h-[80px] self-start relative max-md:top-0 top-14 flex justify-center items-center fade-in">
        <NotificationCardV2 variant="v2" img={cardImg} message={message} />
      </div>
      <div className="py-20 max-md:py-0 fade-in-delay-2">
        <Typography
          variant="caption"
          className={`font-bold max-md:text-[14px] max-md:text-center text-left opacity-100 ${color} uppercase tracking-[3px] mb-2`}
        >
          you need a {card}
        </Typography>

        <Image
          width={380}
          height={239}
          src={`/images/cardList/${img}`}
          alt="food-card"
          className="max-md:w-[330px] max-md:h-[220px]"
        />
      </div>
    </div>
  );
};

const TheWrongCard = () => {
  const landingCTA = useLandingCTAs()
  const spendMessages = [
    // 1st cycle
    {
      message: "I dine out regularly",
      card: "food card",
      img: "food-card.png",
      color: "text-[#FFB395]",
      cardImg: Boy,
    },
    {
      message: "I fly frequently",
      card: "travel card",
      img: "travel-card.png",
      color: "text-[#D7DCDC]",
      cardImg: Girl,
    },
    {
      message: "I shop online frequently",
      card: "shopping card",
      img: "shopping-card.png",
      color: "text-[#FFD799]",
      cardImg: Boy2,
    },
    {
      message: "I go theater often",
      card: "all rounder card",
      img: "rounder.png",
      color: "text-[#BEC0FF]",
      cardImg: Girl2,
    },

    // 2nd cycle
    {
      message: "I frequently order food online",
      card: "food card",
      img: "food-card.png",
      color: "text-[#FFB395]",
      cardImg: Boy,
    },
    {
      message: "I stay at hotels often",
      card: "travel card",
      img: "travel-card.png",
      color: "text-[#D7DCDC]",
      cardImg: Girl,
    },
    {
      message: "I browse deals and shop often",
      card: "shopping card",
      img: "shopping-card.png",
      color: "text-[#FFD799]",
      cardImg: Boy2,
    },
    {
      message: "I have multiple subscriptions",
      card: "all rounder card",
      img: "rounder.png",
      color: "text-[#BEC0FF]",
      cardImg: Girl2,
    },
  ];

  const rightContentList = spendMessages?.map((ele) => (
    <TheWrongCardRightContent
      key={ele?.message}
      cardImg={ele?.cardImg}
      message={ele?.message}
      card={ele?.card}
      img={ele?.img}
      color={ele?.color}
    />
  ));

  return (
    <>
      <style>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(12px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
  
          .fade-in {
            opacity: 0;
            animation: fadeInUp 0.6s ease-out forwards;
          }
  
          .fade-in-delay-2 {
            opacity: 0;
            animation: fadeInUp 0.6s ease-out forwards;
            animation-delay: 1s;
          }
        `}</style>

      <div className="flex max-md:py-14 max-md:px-4 h-screen max-md:h-auto max-md:flex-col-reverse max-md:gap-5 bg-background-primary gap-30 overflow-hidden items-center justify-center relative z-10">
        {/* LEFT CONTENT */}
        <div className="flex flex-col justify-start max-md:items-center items-start z-10">
          <div className="max-w-[984px] mx-auto text-center">
            <Typography className="font-butlerpro font-medium text-left leading-24">
              There&apos;s no <br className="hidden max-md:inline"/>right
              <br className="max-md:hidden" /> <span className="max-md:hidden">credit</span> card.
            </Typography>
            <Typography variant="body" className="text-left opacity-90 max-md:text-center">
              It depends on where you spend. That’s what <br className="hidden max-md:inline"/>we do: we <br className="max-md:hidden" />{" "}
              analyse your spending and <br className="hidden max-md:inline"/> recommend the best for you.
            </Typography>
          </div>

          <Button
            className="text-sm font-bold py-4 px-10 my-10"
            onClick={() => {
              trackEvent(EventName.BUTTON_CLICKED, {
                buttonName: EventName.RECOMMEND_MY_BEST_CARD_BTN,
                location: EventName.LANDING_PAGE,
              });
              landingCTA?.()
            }}
          >
            Recommend my best card
          </Button>
        </div>
        <LayoutTextFlip words={rightContentList} />
      </div>
    </>
  );
};

export default TheWrongCard;
