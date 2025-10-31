"use client";

const cardList = ["amex.png", "mastercard_icon.png", "visa.png"];

const firstRow = [
  ...cardList,
  ...cardList,
  ...cardList,
  ...cardList,
  ...cardList,
];

const CardForYou = () => {
  return (
    <div className="py-30 bg-black max-md:py-[100px] max-md:h-auto overflow-hidden h-screen flex flex-col justify-center">
      <h2 className="text-white mb-18 max-md:mb-10 text-center font-butlerpro text-[80px] max-md:text-[48px] font-medium leading-[120%] tracking-[-3.84px] font-kerning-none font-feature-settings-liga-off">
        {/* Get the card built <br /> for you */}
        Pick from the
        <br /> best options
      </h2>

      <div className="relative overflow-hidden mt-10">
        <div className="flex w-fit animate-scroll-right hover:pause">
          {firstRow.map((ele, index) => (
            <div
              key={`right-${index}`}
              className="w-[250px] h-[150px] max-md:w-[200px] max-md:h-[130px] bg-[rgba(255,255,255,0.05)] mx-5 rounded-[24px] flex items-center justify-center"
              style={{
                backdropFilter: `blur(10px)`,
              }}
            >
        {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/images/cardList/${ele}`}
                className="max-md:w-[100px]"
                alt="card"
              />
            </div>
          ))}
        </div>
      </div>
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
          animation: scroll-right 10s linear infinite;
          will-change: transform;
        }

        .hover\\:pause:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

export default CardForYou;
