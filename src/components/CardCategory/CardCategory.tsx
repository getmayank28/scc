"use client";
import Image from "next/image";
import Typography from "../Typography/Typography";
import NeonBorder from "../Fallback/NeaonBorder/NeaonBorder";
import useNav from "@/lib/hooks/useNav";

const cardData = (navigate:() => void) => [
  {
    title: "All rounder",
    description: (
      <>
       Want all in one? <br/> Discover options  <br/>
        <span className="text-secondary-gray">
        with great rewards  <br/> and flexible benefits
        </span>
      </>
    ),
    image: "/images/all-rounder.svg",
    imgWidth:240,
    imgHeight:222,
    imgStyle:"absolute bottom-5 -right-5",
    onClick: navigate,
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
    imgWidth:280,
    imgHeight:222,
    imgStyle:"absolute top-[-4px] right-0",
    onClick: navigate,

  },
  {
    title: "food & dining",
    description: (
      <>
      Find perfect choices <br/>for earning more <br/>
        <span className="text-secondary-gray">
          on meals, dining, <br/> and delivery.
        </span>
      </>
    ),
    image: "/images/food.svg",
    imgWidth:190,
    imgHeight:222,
    imgStyle:"absolute bottom-3 right-3",
    onClick: navigate,
  },
  {
    title: "shopping",
    description: (
      <>
      Find great choices for <br/>   maximizing rewards<br/>
        <span className="text-secondary-gray">
         on online and<br/> store shopping
        </span>
      </>
    ),
    image: "/images/shopping.svg",
    imgWidth:240,
    imgHeight:222,
    imgStyle:"absolute -bottom-5 right-0",
    onClick: navigate,
  },
];
const CardCategory = () => {

  const {goToChat} = useNav()

  return (
    <div className="pl-16 min-h-screen flex flex-col justify-center items-center gap-10">
      <Typography variant="h3" className="font-butlerpro">What are you looking for?</Typography>
      <div className="grid grid-cols-[fit-content(420px)_1fr] gap-10 max-w-4xl mx-auto">
        {cardData?.(goToChat)?.map((card) => (
          <NeonBorder key={card.title} onClick={card.onClick}>
            <div className="border bg-background-primary border-secondary-orange flex relative p-6 w-[420px] h-[260px] rounded-lg">
              <div>
                <Typography
                  variant="body"
                  className=" text-[20px] text-left uppercase font-bold tracking-[6px] opacity-100 text-tertiary-orange"
                >
                  {card?.title}
                </Typography>
                <Typography
                  variant="body"
                  className="text-left opacity-100 mt-4 font-medium"
                >
                  {card.description}
                </Typography>
              </div>
              <Image
                width={card.imgWidth}
                height={card.imgHeight}
                src={card.image}
                alt="travel"
                className={card.imgStyle}
              />
            </div>
          </NeonBorder>
        ))}
      </div>
    </div>
  );
};

export default CardCategory;
