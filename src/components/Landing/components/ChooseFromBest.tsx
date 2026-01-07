import Typography from "@/components/Typography/Typography";
import Image from "next/image";

const ChooseFromTheBest = () => {
    const cardList = [
      {
        name: "amex.png",
        width: 80,
      },
      {
        name: "rupay.png",
        width: 100,
      },
      {
        name: "mastercard_icon.png",
        width: 40,
      },
      {
        name: "visa-white.png",
        width: 60,
      },
    ];
  
    const firstRow = [
      ...cardList,
      ...cardList,
      ...cardList,
      ...cardList,
      ...cardList,
    ];
  
    return (
      <div className="bg-black pt-12 max-md:mt-6 max-md:pb-6 pb-8">
        <Typography
          variant="body"
          className="text-[14px] font-semibold uppercase tracking-[3px] opacity-60"
        >
          bringing From the best
        </Typography>
        <div className="relative overflow-hidden mt-5 max-md:mt-2">
          <div className="flex w-fit animate-scroll-right hover:pause">
            {firstRow.map((ele, index) => (
              <div
                key={`right-${index}`}
                className="w-[160px] h-[60px] flex items-center justify-center"
              >
                <Image
                  src={`/images/cardList/${ele?.name}`}
                  width={ele?.width}
                  height={100}
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


  export default ChooseFromTheBest