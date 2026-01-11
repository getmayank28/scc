import CardLandingAnimation from "@/components/CardLandingAnimation/CardLandingAnimation";
import Checkmark from "@/components/CheckMark/CheckMark";
import Typography from "@/components/Typography/Typography";
import { Button } from "@/components/ui/button";
import useNav from "@/lib/hooks/useNav";
import Chip from "../ui/chip";
import useUserData from "@/lib/hooks/useUserData";
import { CreditCard } from "../CreditCard";
import Image from "next/image";

const steps = [
  {
    label: "Account created",
    completed: true,
  },
  {
    label: "Tell us about your spending",
    completed: false,
  },
  {
    label: "Get instant card matches",
    completed: false,
  },
  {
    label: "Apply for best card",
    completed: false,
  },
];
const WelcomeScreen = () => {
  const { firstName, nameInitials, name } = useUserData();

  return (
    <div className="flex flex-col justify-center max-w-6xl w-full px-6">
      <div className="flex max-md:flex-col  justify-between items-center border border-secondary-orange p-4 rounded-md">
        <div className="flex gap-3 max-md:gap-2">
          <div className="border flex justify-center items-center max-md:w-12 max-md:h-12 border-primary-orange/60 rounded-full p-4 bg-secondary-orange/20">
            <Typography
              variant="body"
              className="text-left opacity-100 font-bold text-primary-orange/90"
            >
              {nameInitials || "UN"}
            </Typography>
          </div>
          <div>
            <Typography
              variant="body"
              className="text-left opacity-100 font-semibold"
            >
              Welcome, {firstName || ""}
            </Typography>
            <Typography variant="body" className="text-left text-[16px]">
              Let&apos;s start your optimization journey
            </Typography>
          </div>
        </div>
        <Button className="h-12 max-md:mt-4 bg-secondary-orange/30 border border-primary-orange/70 rounded-0 max-w-[300px] rounded-xs">
          Step into smart spending <p className="font-black">→</p>
        </Button>
      </div>

      <div className="border w-full overflow-hidden relative border-secondary-orange px-6 max-md:px-3 py-4 rounded-md mt-12 max-md:mt-6">
        <div className="relative z-10">
          <Typography
            variant="body"
            className="text-left opacity-100 font-semibold text-primary-orange uppercase tracking-[3px]"
          >
            Card built around your spending
          </Typography>
          <div className="flex flex-col gap-3 p-2 py-4">
            {steps?.map((ele) => (
              <div key={ele?.label} className="flex items-center gap-2">
                {ele.completed ? (
                  <Checkmark className="w-[24px]" />
                ) : (
                  <div className="w-6 h-6 rounded-full border border-white/40"></div>
                )}
                <Typography
                  variant="body"
                  className="text-left opacity-100 text-[16px] max-md:font-bold"
                >
                  {ele?.label}
                </Typography>
              </div>
            ))}
            <Button className="h-12 bg-secondary-orange/30 border border-primary-orange/70 rounded-0 max-w-[300px] rounded-xs mt-4">
              Get your personalised card <p className="font-black">→</p>
            </Button>
          </div>
        </div>
        <div className="absolute max-md:opacity-30 -right-28 -top-16 -rotate-24 bg-secondary-orange/30 p-12 rounded-md">
          <CreditCard forShow name={name} background="#111" />
        </div>
      </div>
      <div className="border w-full overflow-hidden relative border-secondary-orange px-6 py-4 pb-7 rounded-md mt-12 max-md:px-3 max-md:mt-6">
        <div className="relative z-10">
          <Typography
            variant="body"
            className="text-left opacity-100 font-semibold text-primary-orange uppercase tracking-[3px] mb-2 max-md:mb-0"
          >
            Join smart spenders squad
          </Typography>
          <Typography
            variant="body"
            className="text-left opacity-100 text-[16px] max-md:text-[14px]"
          >
            You have 3 cards with different benefits. Enter any purchase amount
            and we&apos;ll show you <br className="max-md:hidden" /> which card
            saves you the most.
          </Typography>
          <div className="bg-[#2D1A13] p-2 px-4 max-w-[531px] mt-3 mb-7 max-md:mb-5">
            <Typography
              variant="body"
              className="text-left opacity-100 text-[12px] max-md:text-[12px] font-semibold"
            >
              I have the HDFC Regalia Gold, ICICI Coral, and HDFC Millennia
              credit cards. I am planning <br className="max-md:hidden" /> to
              make an online purchase of ₹1.2 lakh on Amazon. Which credit card
              should I use to get
              <br className="max-md:hidden" /> the maximum benefits for this
              transaction?
            </Typography>
          </div>
          <Button className="h-12 bg-[#2D1A13] border border-primary-orange/70 rounded-0 max-w-[300px] rounded-xs">
            Check best card for a spend <p className="font-black">→</p>
          </Button>
        </div>
        <div className="absolute  -right-10 -top-5 max-md:opacity-0  -rotate-0 p-12 rounded-md">
          <Image
            width={450}
            height={272}
            src="/images/cards-group.png"
            alt="credit cards"
            className="max-md:w-[550px]"
          />
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
