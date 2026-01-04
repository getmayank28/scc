"use client";

import { useState } from "react";
import Typography from "@/components/Typography/Typography";
import Image from "next/image";
import { convertBoldMarkdownToHtml } from "@/lib/utils/markdown";

interface CardProps {
  card?: string;
  'annualSavingsAfterFee)'?: string;
  returnOnSpend?: string;
  annualFee?: string;
  bankIcon?: React.ReactNode;
  apply?: string;
  pattern?: number;
  "whyThisCard?"?: string;
  bestFor?: string;
}

function ChatCard(props: CardProps) {

  const {
    card,
    'annualSavingsAfterFee)':annualSavings,
    returnOnSpend:roi,
    annualFee,
    bankIcon,
    apply,
    pattern = 0,
    bestFor,
  } = props
  const [isFlipped, setIsFlipped] = useState(false);
  const isWavedText = annualFee?.toLowerCase()?.includes("waiv");
  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const getBulletText = (text: string): string => {
    const isFirstWordAnd =
      text?.trim()?.split(" ")?.at(0)?.toLowerCase() === "and";
    const newText = isFirstWordAnd
      ? text?.trim()?.split(" ")?.slice(1)?.join(" ")
      : text.trim();
    const firstLetterUpperCase = newText?.slice(0, 1)?.toUpperCase();
    const restLetterLowerCase = newText?.slice(1)?.toLowerCase();

    return firstLetterUpperCase + restLetterLowerCase;
  };

  // const whyThis = [
  //   {
  //     id: 1,
  //     name: "Why this card?",
  //     designation: "",
  //     icon: <BadgeQuestionMark size={24} />,
  //   },
  // ];
  // const applyNow = [
  //   {
  //     id: 1,
  //     name: "Apply now",
  //     designation: "",
  //     icon: <SquareArrowOutUpRight size={20} />,
  //   },
  // ];

  // const addToFav = [
  //   {
  //     id: 1,
  //     name: "Add to Favourite",
  //     designation: "",
  //     icon: <Heart size={24} />,
  //   },
  // ]; 

  // const goBack = [
  //   {
  //     id: 1,
  //     name: "Go Back",
  //     designation: "",
  //     icon: <ArrowBigLeft size={24} />,
  //   },
  // ]; 


  return (
    <div className="flex items-center justify-center rounded-lg">
      <div className="perspective-1000">
        <div
          className={`relative w-[230px] h-[350px] transition-transform duration-700 transform-style-3d ${
            isFlipped ? "rotate-y-180" : ""
          }`}
          style={{
            transformStyle: "preserve-3d",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Front of card */}

          <div
            className="absolute w-full h-full backface-hidden rounded-2xl shadow-2xl bg-white p-8 flex flex-col items-center justify-center"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="w-[230px]  h-[350px] shadow-[0_15px_40px_rgba(0,0,0,0.7)] overflow-visible bg-background-primary border border-secondary-orange rounded-lg relative">
              <Image
                width={230}
                height={350}
                src={`/images/pattern${pattern + 1}.png`}
                className="w-[230px] h-[350px] rounded-lg opacity-10"
                alt="card"
                draggable="false"
              />

              <div className="absolute w-full top-0 left-0 h-full p-3 py-3 flex flex-col justify-between">
                <div className="flex gap-1 items-center">
                  {bankIcon && <p>{bankIcon}</p>}
                  <Typography variant="p" className="font-bold text-left">
                    {card ? (
                      <span
                        dangerouslySetInnerHTML={{
                          __html: convertBoldMarkdownToHtml(card),
                        }}
                      ></span>
                    ) : (
                      "Credit Card"
                    )}
                  </Typography>
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
                      {annualSavings ? annualSavings : "Maximum"}
                    </Typography>
                    <Typography
                      variant="p"
                      className="text-left pl-10 opacity-90"
                    >
                      Annual Savings
                    </Typography>
                  </div>

                  {annualFee && (
                    <div className="w-full">
                      <Typography variant="h4" className="text-left opacity-70">
                        {annualFee?.split(" ")?.at(0)}
                      </Typography>
                      <Typography
                        variant="p"
                        className="text-left pl-10 opacity-90"
                      >
                        Annual Fee {isWavedText && "(waived)"}
                      </Typography>
                    </div>
                  )}

                  <div className="w-full">
                    <Typography variant="h4" className="text-left opacity-70">
                      {roi ? roi : "Great"}
                    </Typography>
                    <Typography
                      variant="p"
                      className="text-left pl-10 opacity-90"
                    >
                      Return on Annual Spend
                    </Typography>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="text-white w-full border border-primary-orange/70 rounded-full text-[12px] py-1 p-2 cursor-pointer"
                    onClick={handleFlip}
                  >
                    Why this?
                  </button>

                  {apply && (
                    <a
                      href={apply}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white min-w-[80px] w-full font-bold bg-primary-orange/80 border border-secondary-orange rounded-full text-[12px] py-1 p-2 cursor-pointer text-center"
                    >
                      Apply now
                    </a>
                  )}
                </div>
                {/* <div className="flex pl-0 p-4 py-1 gap-8 justify-center">
                  <AnimatedTooltip onClick={handleFlip} items={whyThis} />
                  <AnimatedTooltip
                    onClick={() => window.open(apply, "_blank")}
                    items={applyNow}
                  />
                  <AnimatedTooltip onClick={() => handleAddToFav()} items={addToFav} />
                </div> */}
              </div>
            </div>
          </div>

          {/* Back of card */}
          <div
            className="absolute w-full h-full backface-hidden rounded-2xl shadow-2xl bg-gradient-to-br from-indigo-600 to-purple-700 p-8 flex flex-col items-center justify-center"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <div className="w-[230px]  h-[350px] shadow-[0_15px_40px_rgba(0,0,0,0.7)] overflow-visible bg-background-primary border border-secondary-orange rounded-lg relative">
              <Image
                width={230}
                height={350}
                src={`/images/pattern${pattern + 1}.png`}
                className="w-[230px] h-[350px] rounded-lg opacity-10"
                alt="card"
                draggable="false"
              />
              <div className="absolute w-full top-0 left-0 h-full p-3 py-3 flex flex-col">
                <div className="flex gap-1 items-center">
                  {bankIcon && <p>{bankIcon}</p>}
                  <Typography variant="p" className="font-bold text-left">
                    {card ? (
                      <span
                        dangerouslySetInnerHTML={{
                          __html: convertBoldMarkdownToHtml(card),
                        }}
                      ></span>
                    ) : (
                      "Credit Card"
                    )}
                  </Typography>
                </div>

                <div className="flex flex-col gap-2 mt-3">
                  {props?.["whyThisCard?"] && (
                    <div>
                      <Typography
                        variant="p"
                        className="uppercase text-left text-primary-orange/80 font-bold tracking-[2px]"
                      >
                        Why this card?
                      </Typography>
                      <Typography
                        variant="p"
                        className="text-left opacity-90 font-medium"
                      >
                        {props?.["whyThisCard?"]?.slice(0,380)}
                      </Typography>
                    </div>
                  )}
                  {bestFor && (
                    <div>
                      <Typography
                        variant="p"
                        className="uppercase text-left text-primary-orange/80 font-bold tracking-[2px]"
                      >
                        Your go-to for
                      </Typography>
                      <div>
                        {bestFor?.split(",")?.map((text) => (
                          <Typography
                            key={text}
                            variant="p"
                            className="text-left opacity-90 font-medium"
                          >
                            • {getBulletText(text)}
                          </Typography>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-auto">
                  <button
                    className="text-white w-full border border-primary-orange/70 rounded-full text-[12px] py-1 p-2 cursor-pointer"
                    onClick={handleFlip}
                  >
                    Go Back
                  </button>

                  {apply && (
                    <a
                      href={apply}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white min-w-[80px] w-full font-bold bg-primary-orange/80 border border-secondary-orange rounded-full text-[12px] py-1 p-2 cursor-pointer text-center"
                    >
                      Apply now
                    </a>
                  )}
                </div>

                {/* <div className="flex pl-0 p-4 py-1 gap-8 justify-center">
                  <AnimatedTooltip onClick={handleFlip} items={goBack} />
                  <AnimatedTooltip
                    onClick={() => window.open(apply, "_blank")}
                    items={applyNow}
                  />
                  <AnimatedTooltip onClick={() => {}} items={addToFav} />
                </div> */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatCard;
