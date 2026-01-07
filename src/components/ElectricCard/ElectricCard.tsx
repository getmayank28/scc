import React, { useMemo, useState } from "react";
import Typography from "../Typography/Typography";
import { BadgePlus, Send } from "lucide-react";
import Image from "next/image";
import { Button } from "../ui/button";

interface SelectedProps {
  id: number;
  label: string;
  img: string;
}
const lifestylePreferences = [
  { id: 1, label: "Utility bills", img: "/icons/bills.png" },
  { id: 2, label: "Amazon shopper", img: "/icons/amazon.png" },
  { id: 3, label: "Theatre visits", img: "/icons/movies.png" },
  { id: 4, label: "Monthly medicine", img: "/icons/medicine.png" },
  { id: 5, label: "Grocery essentials", img: "/icons/grocery.png" },
  { id: 6, label: "Netflix chill", img: "/icons/netflix.png" },
  { id: 7, label: "Insurance coverage", img: "/icons/insurance.png" },
  { id: 8, label: "Frequent trips", img: "/icons/trip.png" },
  { id: 9, label: "Flipkart user", img: "/icons/flipkart.png" },
  { id: 10, label: "Nike shoes", img: "/icons/nike.png" },
  { id: 11, label: "Frequent flights", img: "/icons/flights.png" },
  { id: 12, label: "Tax payer", img: "/icons/tax.png" },
  { id: 13, label: "Daily fuel", img: "/icons/fuel.png" },
  { id: 14, label: "Swiggy lover", img: "/icons/swiggy.png" },
  { id: 15, label: "Starbucks coffee", img: "/icons/starbucks.png" },
  { id: 16, label: "Zomato food", img: "/icons/zomato.png" },
];

const firstRow = [
  ...lifestylePreferences,
  ...lifestylePreferences,
  ...lifestylePreferences,
  ...lifestylePreferences,
  ...lifestylePreferences,
];

const Card = ({
  label,
  img,
  size,
  onClick,
  isSelected,
}: {
  label: string;
  img: string;
  size: number;
  onClick: () => void;
  isSelected: boolean;
}) => {
  return (
    <div
      className={`relative cursor-pointer group border ${isSelected ? "border-secondary-success" : "border-primary-orange"} max-md:pb-1 max-md:pt-0 py-2 px-6 rounded-xl`}
      onClick={onClick}
    >
      <div
        className={`absolute -top-[23px] -left-[23px] bg-background-primary z-10 w-[45px] h-[45px] border ${isSelected ? "border-secondary-success" : "border-primary-orange"} p-3 rounded-full flex justify-center items-center`}
      >
        <Image width={size} height={size} src={img} alt={label} />
      </div>
      {!isSelected && (
        <div className="opacity-0 group-hover:opacity-100 duration-500 transition-all  absolute -top-[14px] -right-[10px] z-10 bg-background-primary w-fit p-1 px-2 rounded-full">
          <BadgePlus color="#F35A13" />
        </div>
      )}

      <Typography
        variant="caption"
        className="text-center max-md:text-[10px] max-md:mt-[2px] capitalize font-medium"
      >
        {label}
      </Typography>
    </div>
  );
};

export default function ElectricBorderCard() {
  const [selected, setSelected] = useState<Array<SelectedProps>>([]);

  const selectedIds = useMemo(() => selected?.map((ele) => ele.id), [selected]);
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .electric-card-main {
          font-family: system-ui, -apple-system, sans-serif;
        }
        
        .electric-card-container {
          padding: 2px;
          border-radius: 24px;
          position: relative;
          background:#111111;
        }

        .electric-border-outer {
          border: 2px solid rgba(243, 90, 19, 0.5);
          border-radius: 24px;
          padding-right: 4px;
          padding-bottom: 4px;
        }

        .electric-main-card {
          width: 280px;
          height: 450px;
          border-radius: 24px;
          border: 2px solid #F35A13;
          margin-top: -4px;
          margin-left: -4px;
          filter: url(#turbulent-displace);
        }

        .electric-glow-layer-1 {
          border: 2px solid rgba(243, 90, 19, 0.6);
          border-radius: 24px;
          width: 100%;
          height: 100%;
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          filter: blur(1px);
          pointer-events: none;
        }

        .electric-glow-layer-2 {
          border: 2px solid #F35A13;
          border-radius: 24px;
          width: 100%;
          height: 100%;
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          filter: blur(4px);
          pointer-events: none;
        }

        .electric-overlay-1 {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 24px;
          opacity: 1;
          mix-blend-mode: overlay;
          transform: scale(1.1);
          filter: blur(16px);
          background: linear-gradient(-30deg, white, transparent 30%, transparent 70%, white);
          pointer-events: none;
        }

        .electric-overlay-2 {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 24px;
          opacity: 0.5;
          mix-blend-mode: overlay;
          transform: scale(1.1);
          filter: blur(16px);
          background: linear-gradient(-30deg, white, transparent 30%, transparent 70%, white);
          pointer-events: none;
        }

        .electric-background-glow {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 24px;
          filter: blur(32px);
          transform: scale(1.1);
          opacity: 0.3;
          z-index: -1;
          background: linear-gradient(-30deg, #F35A13, transparent, #F35A13);
          pointer-events: none;
        }

        .electric-glass-button {
          background: radial-gradient(47.2% 50% at 50.39% 88.37%, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0) 100%),
            rgba(255, 255, 255, 0.04);
          position: relative;
          transition: background 0.3s ease;
          border-radius: 14px;
          width: fit-content;
          height: fit-content;
          padding: 8px 16px;
          text-transform: uppercase;
          font-weight: bold;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.8);
        }

        .electric-glass-button:hover {
          background: radial-gradient(47.2% 50% at 50.39% 88.37%, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0) 100%),
            rgba(255, 255, 255, 0.08);
        }

        .electric-glass-button::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          padding: 1px;
          background: linear-gradient(150deg, rgba(255, 255, 255, 0.48) 16.73%, rgba(255, 255, 255, 0.08) 30.2%,
            rgba(255, 255, 255, 0.08) 68.2%, rgba(255, 255, 255, 0.6) 81.89%);
          border-radius: inherit;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }

        .electric-divider {
          border: none;
          height: 1px;
          background-color: currentColor;
          opacity: 0.1;
          -webkit-mask-image: linear-gradient(to right, transparent, black, transparent);
          mask-image: linear-gradient(to right, transparent, black, transparent);
        }

        @media (max-width: 768px) {
        .electric-main-card {
          width: 220px;
          height: 330px;
           margin-top: 0px;
          margin-left: 0px;
        }
}
      `,
        }}
      />

      <main className="electric-card-main rounded-3xl flex flex-col items-center justify-center text-white overflow-hidden">
        <svg className="absolute" width="0" height="0">
          <defs>
            <filter
              id="turbulent-displace"
              colorInterpolationFilters="sRGB"
              x="-20%"
              y="-20%"
              width="140%"
              height="140%"
            >
              <feTurbulence
                type="turbulence"
                baseFrequency="0.02"
                numOctaves="10"
                result="noise1"
                seed="1"
              />
              <feOffset in="noise1" dx="0" dy="0" result="offsetNoise1">
                <animate
                  attributeName="dy"
                  values="700; 0"
                  dur="6s"
                  repeatCount="indefinite"
                  calcMode="linear"
                />
              </feOffset>
              <feTurbulence
                type="turbulence"
                baseFrequency="0.02"
                numOctaves="10"
                result="noise2"
                seed="1"
              />
              <feOffset in="noise2" dx="0" dy="0" result="offsetNoise2">
                <animate
                  attributeName="dy"
                  values="0; -700"
                  dur="6s"
                  repeatCount="indefinite"
                  calcMode="linear"
                />
              </feOffset>
              <feTurbulence
                type="turbulence"
                baseFrequency="0.02"
                numOctaves="10"
                result="noise1"
                seed="2"
              />
              <feOffset in="noise1" dx="0" dy="0" result="offsetNoise3">
                <animate
                  attributeName="dx"
                  values="490; 0"
                  dur="6s"
                  repeatCount="indefinite"
                  calcMode="linear"
                />
              </feOffset>
              <feTurbulence
                type="turbulence"
                baseFrequency="0.02"
                numOctaves="10"
                result="noise2"
                seed="2"
              />
              <feOffset in="noise2" dx="0" dy="0" result="offsetNoise4">
                <animate
                  attributeName="dx"
                  values="0; -490"
                  dur="6s"
                  repeatCount="indefinite"
                  calcMode="linear"
                />
              </feOffset>
              <feComposite
                in="offsetNoise1"
                in2="offsetNoise2"
                result="part1"
              />
              <feComposite
                in="offsetNoise3"
                in2="offsetNoise4"
                result="part2"
              />
              <feBlend
                in="part1"
                in2="part2"
                mode="color-dodge"
                result="combinedNoise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="combinedNoise"
                scale="30"
                xChannelSelector="R"
                yChannelSelector="B"
              />
            </filter>
          </defs>
        </svg>

        <div className="electric-card-container">
          <div className="relative">
            <div className="electric-border-outer">
              <div className="electric-main-card"></div>
            </div>
            <div className="electric-glow-layer-1"></div>
            <div className="electric-glow-layer-2"></div>
          </div>
          <div className="electric-overlay-1"></div>
          <div className="electric-overlay-2"></div>
          <div className="electric-background-glow"></div>
          <div className="absolute -rotate-90 w-[450px] h-[280px] max-md:w-[330px] max-md:h-[220px] max-md:top-15 max-md:-left-13 top-22 -left-20 right-0 bottom-0 flex flex-col">
            <div className="p-5 max-md:p-2 max-md:mt-4">
              <Typography
                variant="body"
                className="text-center max-md:font-semibold max-md:text-center opacity-100 tracking-[3px] uppercase"
              >
                Pick what you need!
              </Typography>
              <div className="pt-10 flex items-center flex-col gap-8 ">
                <div className="flex w-fit gap-10 animate-scroll-right hover:pause">
                  {firstRow.map((ele) => (
                    <Card
                      key={ele.id}
                      size={20}
                      label={ele?.label}
                      isSelected={selectedIds?.includes(ele?.id)}
                      img={ele?.img}
                      onClick={() => {
                        if (selectedIds?.includes(ele?.id)) {
                          const filtered = selected?.filter(
                            (card) => card?.id !== ele?.id
                          );
                          setSelected(filtered);
                        } else {
                          if (selected?.length === 5) {
                            return;
                          }
                          setSelected((prev) => [...prev, ele]);
                        }
                      }}
                    />
                  ))}
                </div>
                <div className="flex  gap-2 ">
                  <div className="h-14 w-14 max-md:h-10 max-md:w-10 flex justify-center items-center border border-primary-orange rounded-full">
                    {selected?.length && selected?.at(0) ? (
                      <Image
                        width={25}
                        height={25}
                        src={selected?.at(0)?.img || ""}
                        alt={selected?.at(0)?.label || ""}
                        className="max-md:h-[18px] max-md:w-[18px]"
                      />
                    ) : (
                      <></>
                    )}
                  </div>
                  <div className="h-14 w-14 max-md:h-10 max-md:w-10 flex justify-center items-center border border-primary-orange rounded-full">
                    {selected?.length && selected?.at(1) ? (
                      <Image
                        width={25}
                        height={25}
                        src={selected?.at(1)?.img || ""}
                        alt={selected?.at(1)?.label || ""}
                        className="max-md:h-[18px] max-md:w-[18px]"
                      />
                    ) : (
                      <></>
                    )}
                  </div>
                  <div className="h-14 w-14 max-md:h-10 max-md:w-10 flex justify-center items-center border border-primary-orange rounded-full">
                    {selected?.length && selected?.at(2) ? (
                      <Image
                        width={25}
                        height={25}
                        src={selected?.at(2)?.img || ""}
                        alt={selected?.at(2)?.label || ""}
                        className="max-md:h-[18px] max-md:w-[18px]"
                      />
                    ) : (
                      <></>
                    )}
                  </div>
                  <div className="h-14 w-14 max-md:h-10 max-md:w-10 flex justify-center items-center border border-primary-orange rounded-full">
                    {selected?.length && selected?.at(3) ? (
                      <Image
                        width={25}
                        height={25}
                        src={selected?.at(3)?.img || ""}
                        alt={selected?.at(3)?.label || ""}
                        className="max-md:h-[18px] max-md:w-[18px]"
                      />
                    ) : (
                      <></>
                    )}
                  </div>
                  <div className="h-14 w-14 max-md:h-10 max-md:w-10 flex justify-center items-center border border-primary-orange rounded-full">
                    {selected?.length && selected?.at(4) ? (
                      <Image
                        width={25}
                        height={25}
                        src={selected?.at(4)?.img || ""}
                        alt={selected?.at(4)?.label || ""}
                        className="max-md:h-[18px] max-md:w-[18px]"
                      />
                    ) : (
                      <></>
                    )}
                  </div>
                  {selectedIds?.length === 5 && (
                    <Button className="h-14 w-14 max-md:h-10 max-md:w-10">
                      <Send />{" "}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <style jsx>{`
        @keyframes scroll-right {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-20%);
          }
        }

        .animate-scroll-right {
          animation: scroll-right 30s linear infinite;
          will-change: transform;
        }

      @media (hover: hover) and (pointer: fine) {
  .hover\:pause:hover {
    animation-play-state: paused;
  }
      `}</style>
    </>
  );
}
