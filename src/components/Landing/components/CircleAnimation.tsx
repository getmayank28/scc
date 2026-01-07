"use client";

import useIsMobile from "@/lib/hooks/useIsMobile";
import Image from "next/image";

export default function AnimatedCircles({
  isAnimated,
}: {
  isAnimated: boolean;
}) {
  const {isMobile} = useIsMobile()

  const circles = [
    {
      id: 1,
      text: "/icons/flights.png",
      size: "w-40 h-40",
      delay: 0,
      x: 20,
      y: -0,
      h: 160,
      w: 160,
      title: "Flights",
      textStyle: "text-[20px] font-bold",
    },
    {
      id: 2,
      text: "/icons/tax.png",
      size: "w-22 h-22",
      delay: 100,
      x: -150,
      y: -30,
      h: 88,
      w: 88,
      title: "Tax",
      textStyle: "text-[20px] font-bold",
    },
    {
      id: 3,
      text: "/icons/starbucks.png",
      size: "w-36 h-36",
      delay: 200,
      x: 120,
      y: 120,
      h: 144,
      w: 144,
      title: "Coffee",
      textStyle: "text-[22px] font-bold",
    },
    {
      id: 4,
      text: "/icons/flipkart.png",
      size: "w-24 h-24",
      delay: 300,
      x: -110,
      y: -130,
      h: 50,
      w: 50,
      title: "E Comm.",
      textStyle: "text-[16px] font-bold",
    },
    {
      id: 5,
      text: "/icons/swiggy.png",
      size: "w-30 h-30",
      delay: 400,
      x: -130,
      y: 110,
      h: 60,
      w: 60,
      title: "Food",
      textStyle: "text-[24px] font-bold",
    },
    {
      id: 6,
      text: "/icons/fuel.png",
      size: "w-24 h-24",
      delay: 500,
      x: -250,
      y: 10,
      h: 50,
      w: 50,
      title: "Fuel",
      textStyle: "text-[20px] font-bold",
    },
    {
      id: 7,
      text: "/icons/medicine.png",
      size: "w-28 h-28",
      delay: 600,
      x: -160,
      y: -230,
      h: 65,
      w: 65,
      title: "Pharmacy",
      textStyle: "text-[20px] font-bold",
    },
    {
      id: 8,
      text: "/icons/zomato.png",
      size: "w-20 h-20",
      delay: 700,
      x: -40,
      y: 100,
      h: 80,
      w: 80,
      title: "Dining",
      textStyle: "text-[18px] font-bold",
    },
    {
      id: 9,
      text: "/icons/trip.png",
      size: "w-32 h-32",
      delay: 800,
      x: -220,
      y: -100,
      h: 128,
      w: 128,
      title: "Trips",
      textStyle: "text-[24px] font-bold",
    },
    {
      id: 10,
      text: "/icons/netflix.png",
      size: "w-32 h-32",
      delay: 900,
      x: 60,
      y: -160,
      h: 128,
      w: 128,
      title: "Entertainment",
      textStyle: "text-[16px] font-bold",
    },
    {
      id: 11,
      text: "/icons/nike.png",
      size: "w-36 h-36",
      delay: 1000,
      x: 180,
      y: -30,
      h: 144,
      w: 144,
      title: "Shopping",
      textStyle: "text-[18px] font-bold",
    },
    {
      id: 12,
      text: "/icons/insurance.png",
      size: "w-20 h-20",
      delay: 1100,
      x: 160,
      y: -190,
      h: 80,
      w: 80,
      title: "Insurance",
      textStyle: "text-[14px] font-bold",
    },
    {
      id: 13,
      text: "/icons/grocery.png",
      size: "w-20 h-20",
      delay: 300,
      x: -70,
      y: -230,
      h: 80,
      w: 80,
      title: "Grocery",
      textStyle: "text-[14px] font-bold",
    },
    {
      id: 14,
      text: "/icons/amazon.png",
      size: "w-24 h-24",
      delay: 1200,
      x: 25,
      y: -300,
      h: 110,
      w: 110,
      title: "A to Z",
      textStyle: "text-[18px] font-bold",
    },
    {
      id: 15,
      text: "/icons/movies.png",
      size: "w-20 h-20",
      delay: 1500,
      x: 120,
      y: -280,
      h: 80,
      w: 80,
      title: "Movies",
      textStyle: "text-[16px] font-bold",
    },
    {
      id: 16,
      text: "/icons/bills.png",
      size: "w-24 h-24",
      delay: 1400,
      x: -90,
      y: -330,
      h: 96,
      w: 96,
      title: "Bills",
      textStyle: "text-[22px] font-bold",
    },
  ];

  const circlesMobile = [
    {
      id: 1,
      text: "/icons/flights.png",
      size: "w-30 h-30",
      delay: 0,
      x: 20,
      y: -0,
      h: 140,
      w: 140,
      title: "Flights",
      textStyle: "text-[20px] font-bold",
      imgStyle:"!w-[100px]"
    },
    {
      id: 2,
      text: "/icons/tax.png",
      size: "w-12 h-12",
      delay: 100,
      x: -95,
      y: 15,
      h: 40,
      w: 40,
      title: "Tax",
      textStyle: "text-[20px] font-bold",
      imgStyle:"!w-[30px]"
    },
    {
      id: 3,
      text: "/icons/starbucks.png",
      size: "w-16 h-16",
      delay: 200,
      x: 80,
      y: 30,
      h: 144,
      w: 144,
      title: "Coffee",
      textStyle: "text-[22px] font-bold",
    },
    {
      id: 4,
      text: "/icons/flipkart.png",
      size: "w-14 h-14",
      delay: 300,
      x: -65,
      y: -115,
      h: 50,
      w: 50,
      title: "E Comm.",
      textStyle: "text-[16px] font-bold",
      imgStyle:"!w-[30px]"
    },
    {
      id: 5,
      text: "/icons/swiggy.png",
      size: "w-20 h-20",
      delay: 400,
      x: -30,
      y: 85,
      h: 60,
      w: 60,
      title: "Food",
      textStyle: "text-[24px] font-bold",
      imgStyle:"!w-[40px]"
    },
    {
      id: 6,
      text: "/icons/fuel.png",
      size: "w-14 h-14",
      delay: 500,
      x: -150,
      y: 20,
      h: 50,
      w: 50,
      title: "Fuel",
      textStyle: "text-[20px] font-bold",
       imgStyle:"!w-[30px]"
    },
    {
      id: 7,
      text: "/icons/medicine.png",
      size: "w-18 h-18",
      delay: 600,
      x: -125,
      y: -140,
      h: 65,
      w: 65,
      title: "Pharmacy",
      textStyle: "text-[20px] font-bold",
       imgStyle:"!w-[45px]"
    },
    {
      id: 8,
      text: "/icons/zomato.png",
      size: "w-10 h-10",
      delay: 700,
      x: 15,
      y: 40,
      h: 80,
      w: 80,
      title: "Dining",
      textStyle: "text-[18px] font-bold",
       imgStyle:"!w-[20px]"
    },
    {
      id: 9,
      text: "/icons/trip.png",
      size: "w-22 h-22",
      delay: 800,
      x: -105,
      y: -40,
      h: 128,
      w: 128,
      title: "Trips",
      textStyle: "text-[24px] font-bold",
       imgStyle:"!w-[60px]"
    },
    {
      id: 10,
      text: "/icons/netflix.png",
      size: "w-22 h-22",
      delay: 900,
      x: 30,
      y: -125,
      h: 128,
      w: 128,
      title: "Entertainment",
      textStyle: "text-[16px] font-bold",
       imgStyle:"!w-[60px]"
    },
    {
      id: 11,
      text: "/icons/nike.png",
      size: "w-16 h-16",
      delay: 1000,
      x: -200,
      y: -24,
      h: 144,
      w: 144,
      title: "Shopping",
      textStyle: "text-[18px] font-bold",
       imgStyle:"!w-[40px]"
    },
    {
      id: 12,
      text: "/icons/insurance.png",
      size: "w-8 h-8",
      delay: 1100,
      x: 60,
      y: -40,
      h: 80,
      w: 80,
      title: "Insurance",
      textStyle: "text-[14px] font-bold",
    },
    {
      id: 13,
      text: "/icons/grocery.png",
      size: "w-12 h-12",
      delay: 300,
      x: -70,
      y: -180,
      h: 80,
      w: 80,
      title: "Grocery",
      textStyle: "text-[14px] font-bold",
      imgStyle:"!w-[25px]"

    },
    {
      id: 14,
      text: "/icons/amazon.png",
      size: "w-16 h-16",
      delay: 1200,
      x: 80,
      y: -80,
      h: 110,
      w: 110,
      title: "A to Z",
      textStyle: "text-[18px] font-bold",
    },
    {
      id: 15,
      text: "/icons/movies.png",
      size: "w-12 h-12",
      delay: 1500,
      x: -120,
      y: 65,
      h: 80,
      w: 80,
      title: "Movies",
      textStyle: "text-[16px] font-bold",
    },
    {
      id: 16,
      text: "/icons/bills.png",
      size: "w-14 h-14",
      delay: 1400,
      x: -190,
      y: -100,
      h: 96,
      w: 96,
      title: "Bills",
      textStyle: "text-[22px] font-bold",
      imgStyle:"!w-[30px]"

    },
  ];

  const data = isMobile?circlesMobile:circles

  return (
    <div className="w-[500px] max-md:w-[400px] max-md:h-[400px] ml-10 h-[500px] relative rounded-full  flex flex-col items-center justify-center p-8">
      <div className="absolute max-md:top-[16%] max-md:left-[18%] top-[28%] left-[24%]">
        <div className="relative  w-[400px] h-[400px]">
          {data?.map((circle) => {
            return (
              <div
                key={circle.id}
                className={`absolute group top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${circle.size} border border-primary-orange/60 bg-primary-orange/10 rounded-full flex items-center justify-center text-white font-medium text-center p-4 max-md:p-2 shadow-lg transition-all duration-700 ease-out ${
                  isAnimated ? "opacity-100 scale-100" : "opacity-0 scale-0"
                }`}
                style={{
                  transform: isAnimated
                    ? `translate(calc(-50% + ${circle.x}px), calc(-50% + ${circle.y}px)) scale(1)`
                    : "translate(-50%, -50%) scale(0)",
                  transitionDelay: `${circle.delay}ms`,
                }}
              >
                <div
                  className={`${circle.size} scale-0 group-hover:scale-100 transition-all duration-300 flex justify-center items-center rounded-full border border-primary-orange fixed bg-background-primary px-2 py-1`}
                >
                 <p className={circle.textStyle}>{circle.title}</p>
                </div>
                <Image
                  width={circle.w}
                  height={circle.h}
                  //@ts-expect-error this is valid
                  className={circle?.imgStyle}
                  src={circle.text}
                  alt="image"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
