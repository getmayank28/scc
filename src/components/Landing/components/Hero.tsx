import ElectricBorderCard from "@/components/ElectricCard/ElectricCard";
import Typography from "@/components/Typography/Typography";
import ColourfulText from "@/components/ui/colourful-text";
import { Button } from "@/components/ui/stateful-button";
import { BadgeCheck, CircleCheck } from "lucide-react";
import Boy from "../../../../public/images/boy.png";
import Girl from "../../../../public/images/girl.png";
import Boy2 from "../../../../public/images/boy2.png";
import Girl2 from "../../../../public/images/girl2.png";
import Image, { StaticImageData } from "next/image";
import { LayoutTextFlip } from "@/components/ui/layout-text-flip";
import MasterCard from "../../../../public/images/cardList/mastercard_icon.png";
import AMEX from "../../../../public/images/cardList/amex-dark.png";
import Visa from "../../../../public/images/cardList/visa-white.png";
import Rupay from "../../../../public/images/cardList/rupay-icon.png";
import useLandingCTAs from "@/lib/hooks/useLandingCTAs";

const NotificationCard = ({
  message,
  img,
  time,
  imgWidth = 40,
}: {
  message?: string;
  img: StaticImageData;
  time: string;
  imgWidth?: number;
}) => {
  return (
    <div className="w-sm max-md:w-[280px] border bg-background-primary border-secondary-gray/80 p-2 max-md:py-1 flex rounded-lg gap-4 items-center">
      <div className="w-[54px] h-[54px] max-md:!w-[40px] max-md:h-[40px] bg-white/20 flex justify-center items-center rounded-lg">
        <Image height={39} width={imgWidth} src={img} alt="user" className="max-md:w-[20px]" />
      </div>
      <div className="flex flex-col justify-between">
        <Typography
          variant="caption"
          className="text-start opacity-100 font-medium max-md:text-[12px]"
        >
          {message}
        </Typography>
        <Typography
          variant="caption"
          className="text-start text-[12px]  max-md:text-[10px] mt-2 opacity-100 font-medium text-secondary-gray"
        >
          {time}
        </Typography>
      </div>
      <div className="ml-auto">
        <CircleCheck color="#aaaaaa" size={30} className="max-md:w-[20px]"/>
      </div>
    </div>
  );
};
export const NotificationCardV2 = ({
  variant,
  time,
  message,
  img,
}: {
  variant?: string;
  message?: string;
  time?: string;
  img: StaticImageData;
}) => {
  return (
    <div className="w-sm max-md:w-[280px] max-md:p-1 border bg-background-primary border-secondary-gray/80 p-2 pr-3 flex rounded-lg gap-4 items-center">
      <div className="w-[54px] h-[54px] max-md:!w-[40px] max-md:h-[40px] bg-white/20 flex justify-center items-end rounded-lg">
        <Image height={50} width={50} src={img} alt="user" className="max-md:!w-[30px]" />
      </div>
      <div className="flex flex-col justify-between grow">
        {variant !== "v2" && (
          <div className="flex items-center justify-between">
            <div className="flex  gap-2 items-center justify-center">
              <Typography
                variant="caption"
                className="text-[14px] max-md:text-[12px] max-md:opacity-90 text-start opacity-100 font-medium"
              >
                Recevied Cashback
              </Typography>
              <BadgeCheck color="#F15A29" size={14} className="max-md:w-[12px]" />
            </div>
            <Typography
              variant="caption"
              className="text-[12px] max-md:text-[10px] text-start opacity-100 font-medium"
            >
              {time ? time : "2 Min"}
            </Typography>
          </div>
        )}
        <Typography
          variant="body"
          className={`text-start ${variant === "v2" ? "text-[16px] max-md:text-[12px] max-md:text-left uppercase tracking-wider font-medium" : "max-md:text-[12px] max-md:text-left text-[14px] font-bold "} opacity-100 mt-1 text-white`}
        >
          {message}
        </Typography>
      </div>
    </div>
  );
};

const billPaids = [
  <NotificationCard
    key="food"
    img={Rupay}
    imgWidth={30}
    time="01:05 PM"
    message="Paid ₹6500 for the food"
  />,
  <NotificationCard
    key="flight"
    img={AMEX}
    time="10:05 AM"
    message="Paid ₹1200 for the flight"
  />,
  <NotificationCard
    key="groceries"
    img={Visa}
    time="05:30 PM"
    message="Paid ₹900 for groceries"
  />,
  <NotificationCard
    key="shopping"
    img={MasterCard}
    time="08:20 AM"
    message="Paid ₹2000 for shopping"
  />,
  <NotificationCard
    key="electronics"
    img={Rupay}
    imgWidth={30}
    time="09:54 PM"
    message="Paid ₹5000 for electronics"
  />,
  <NotificationCard
    key="fuel"
    img={AMEX}
    time="07:34 PM"
    message="Paid ₹2500 for fuel"
  />,
  <NotificationCard
    key="dining"
    img={Visa}
    time="06:20 PM"
    message="Paid ₹1800 for dining"
  />,
  <NotificationCard
    key="hotel"
    img={MasterCard}
    time="09:45 AM"
    message="Paid ₹3200 for hotel stay"
  />,
  <NotificationCard
    key="clothes"
    img={Rupay}
    imgWidth={30}
    time="07:23 AM"
    message="Paid ₹1800 for clothes"
  />,
  <NotificationCard
    key="movies"
    img={AMEX}
    time="04:44 PM"
    message="Paid ₹800 for movie tickets"
  />,
  <NotificationCard
    key="cab"
    img={Visa}
    time="11:12 PM"
    message="Paid ₹1200 for cab rides"
  />,
  <NotificationCard
    key="bills"
    img={MasterCard}
    time="10:08 AM"
    message="Paid ₹4000 for monthly bills"
  />,
  <NotificationCard
    key="subscriptions"
    img={Rupay}
    imgWidth={30}
    time="03:45 PM"
    message="Paid ₹999 for subscriptions"
  />,
];

const rewardsReceived = [
  <NotificationCardV2
    key="flights"
    img={Boy}
    message="₹2500 for flights"
    time="2 Min"
  />,
  <NotificationCardV2
    key="movies"
    img={Girl}
    message="₹300 for movie tickets"
    time="8 Min"
  />,
  <NotificationCardV2
    key="amazon-food"
    img={Boy2}
    message="Amazon coupon for food"
    time="10 Min"
  />,
  <NotificationCardV2
    key="fuel"
    img={Girl2}
    message="₹600 on fuel purchase"
    time="12 Min"
  />,
  <NotificationCardV2
    key="shopping"
    img={Boy}
    message="₹500 for shopping"
    time="15 Min"
  />,
  <NotificationCardV2
    key="hotel"
    img={Girl}
    message="₹2000 on hotel booking"
    time="1 Hr"
  />,
  <NotificationCardV2
    key="groceries"
    img={Boy2}
    message="₹750 on grocery spend"
    time="22 Min"
  />,
  <NotificationCardV2
    key="travel"
    img={Girl2}
    message="Travel voucher on Fuel"
    time="30 Min"
  />,
  <NotificationCardV2
    key="subscriptions"
    img={Boy}
    message="₹150 on subscriptions"
    time="45 Min"
  />,
];

const HeroSection = () => {
  const landingCTA = useLandingCTAs()

  return (
    <div className="flex max-md:px-4 max-md:pb-14 max-md:gap-0 max-md:flex-col-reverse max-md:pt-14 pt-16 h-screen max-md:h-auto bg-background-primary gap-30 overflow-hidden items-center justify-center  relative z-10">
      <div className="max-md:-mt-2 flex flex-col max-md:items-center justify-start items-start z-10">
        <div className="max-w-[984px] mx-auto text-center">
          <Typography
            variant="caption"
            className="font-medium max-md:text-center max-md:text-[12px] text-left text-primary-orange uppercase opacity-100 tracking-[6px] -mb-1"
          >
            The card is a key to
          </Typography>
          <Typography className="font-butlerpro max-md:mt-3 font-medium text-left leading-24 max-md:text-center">
          turning <br className="hidden max-md:inline"/> spending <br className="max-md:hidden" /> into <br className="hidden max-md:inline" />{" "}
            <span className="font-bold">
              <ColourfulText text="benefits" />
            </span>
          </Typography>
          <Typography variant="body" className="text-left opacity-90 max-md:text-center">
            Discover the card tailored for your spending
            <br /> to maximize every swipe effortlessly
          </Typography>
        </div>
        <Button
          className="text-sm max-md:mt-6 font-bold py-4 px-10 my-10"
          onClick={landingCTA}
        >
          Step into smarter spending
        </Button>
      </div>
      <div className="w-[450px]  relative flex flex-col justify-center items-center z-10">
        <div className="w-[390px] self-start h-[80px] relative -bottom-14 flex justify-center items-center">
          <LayoutTextFlip words={billPaids} />
        </div>
        <div className="rotate-90">
          <ElectricBorderCard />
        </div>
        <div className="w-[390px] h-[80px] self-end relative bottom-14 flex justify-center items-center">
          <LayoutTextFlip words={rewardsReceived} />
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
