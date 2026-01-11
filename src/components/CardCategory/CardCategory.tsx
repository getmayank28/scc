"use client";
import Image from "next/image";
import Typography from "../Typography/Typography";
import NeonBorder from "../Fallback/NeaonBorder/NeaonBorder";
import { saveToSessionStorage } from "@/lib/utils/sessionStorage";
import { CARD_CATEGORY_KEY } from "@/lib/constants/storage";
import { CARD_CATEGORY } from "@/lib/data/cards";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";
import useIsMobile from "@/lib/hooks/useIsMobile";
import { cn } from "@/lib/utils";

const cardData = (handleClick: (value:string) => void) => [
  {
    title: "All rounder",
    description: (
      <>
        Want all in one? <br /> Discover options <br />
        <span className="text-secondary-gray">
          with great rewards <br /> and flexible benefits
        </span>
      </>
    ),
    image: "/images/all-rounder.svg",
    imgWidth: 240,
    imgHeight: 222,
    imgStyle: "absolute bottom-5 -right-5",
    mobileImgStyle: "absolute top-0 left-4 max-md:w-[150px]",
    titleStyle:"max-md:mt-[115px]",
    onClick:() =>  handleClick(CARD_CATEGORY.ALL_ROUNDER),
  },
  {
    title: "travel",
    description: (
      <>
        Upgrade the way
        <br />
        you travel with <br />
        <span className="text-secondary-gray">
          premium benefits <br />
          with great rewards.
        </span>
      </>
    ),
    image: "/images/travel.svg",
    imgWidth: 280,
    imgHeight: 222,
    imgStyle: "absolute top-[-4px] right-0",
    titleStyle:"max-md:mt-[115px]",
    mobileImgStyle: "absolute top-0 left-2 max-md:w-[140px]",
   onClick:() =>  handleClick(CARD_CATEGORY.TRAVEL),
  },
  {
    title: "food & dining",
    description: (
      <>
        Find perfect choices <br />
        for earning more <br />
        <span className="text-secondary-gray">
          on meals, dining, <br /> and delivery.
        </span>
      </>
    ),
    image: "/images/food.svg",
    imgWidth: 190,
    imgHeight: 222,
    imgStyle: "absolute bottom-3 right-3",
    titleStyle:"max-md:mt-[115px]",
    mobileImgStyle: "absolute top-2 left-7 max-md:w-[110px]",
   onClick:() =>  handleClick(CARD_CATEGORY.FOOD),
  },
  {
    title: "shopping",
    description: (
      <>
        Find great choices for <br /> maximizing rewards
        <br />
        <span className="text-secondary-gray">
          on online and
          <br /> store shopping
        </span>
      </>
    ),
    image: "/images/shopping.svg",
    imgWidth: 240,
    imgHeight: 222,
    imgStyle: "absolute -bottom-5 right-0",
    titleStyle:"max-md:mt-[115px]",
    mobileImgStyle: "absolute -top-4 left-1 max-md:w-[150px]",
   onClick:() =>  handleClick(CARD_CATEGORY.SHOPPING),
  },
];
const CardCategory = () => {
  const router = useRouter()
 const {isMobile} = useIsMobile()


  const handleClick = (value:string) => {
    saveToSessionStorage(CARD_CATEGORY_KEY,value)
    router.replace(ROUTES.CHAT)
  }

  return (
    <div className="pl-16 max-md:pb-[96px] max-md:pl-0 min-h-screen max-md:h-auto flex flex-col justify-center items-center gap-10">
      <Typography variant="h3" >
        What are you <br className="hidden max-md:inline"/> looking for?
      </Typography>
      <div className="grid grid-cols-[fit-content(420px)_1fr] max-md:grid-cols-2 max-md:gap-4 gap-10 max-w-4xl mx-auto">
        {cardData?.(handleClick)?.map((card) => (
          <NeonBorder key={card.title} onClick={card.onClick}>
            <div className="border max-md:flex-col-reverse max-md:p-2 max-md:justify-center max-md:items-center max-md:gap-0 max-md:h-[150px] max-md:w-[160px] bg-background-primary border-secondary-orange flex relative p-6 w-[420px] h-[260px] rounded-lg">
              <div>
                <Typography
                  variant="body"
                  className={cn("text-[20px] max-md:text-[12px] max-md:tracking-[3px] text-left max-md:text-left uppercase font-bold tracking-[6px] opacity-100 text-tertiary-orange", card?.titleStyle)}
                >
                  {card?.title}
                </Typography>
                <Typography
                  variant="body"
                  className="text-left max-md:hidden opacity-100  mt-4 font-medium"
                >
                  {card.description}
                </Typography>
              </div>
              <Image
                width={card.imgWidth}
                height={card.imgHeight}
                src={card.image}
                alt="travel"
                className={isMobile?card.mobileImgStyle:card.imgStyle}
              />
            </div>
          </NeonBorder>
        ))}
      </div>
    </div>
  );
};

export default CardCategory;
