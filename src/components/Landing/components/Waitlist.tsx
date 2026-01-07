"use client";
import Typography from "@/components/Typography/Typography";
import ColourfulText from "@/components/ui/colourful-text";
import { Spotlight } from "@/components/ui/spotlight-new";
import { Button } from "@/components/ui/stateful-button";
import WaitlistModal from "./WaitlistModal";
import { useWaitlistControl } from "@/contexts/WaitlistContext";

const Waitlist = () => {
  const { openWaitlistModal } = useWaitlistControl();

  return (
    <div className="bg-black max-md:px-4 relative flex flex-col justify-center items-center  h-screen overflow-hidden">
      <Spotlight />
      <div className="relative z-10 max-md:mb-10 max-md:h-auto  max-md:gap-10">
        <Typography
          variant="h1"
          className="opacity-100 max-md:hidden"
        >
          We make your card
          <br />
          <ColourfulText text="spending shine" />
        </Typography>
        <Typography
          variant="h1"
          className="opacity-100 max-md:text-[60px] hidden max-md:block"
        >
          We make <br /> <ColourfulText text="your card" />
          <br className="max-md:hidden" /> <br />
          spending
          <br /> <ColourfulText text="shine" />
        </Typography>
        <Typography
          variant="body"
          className="text-[20px] max-md:text-[20px] mt-4 opacity-70"
        >
          Personalized card recommendations based on your needs{" "}
          <br className="max-md:hidden" />
          because your spending deserves the right card.
        </Typography>
        <div
          onClick={openWaitlistModal}
          className="mx-auto max-md:w-[350px] mt-10 h-14 pr-2 pl-5 flex justify-between items-center max-w-md rounded-full border border-secondary-orange"
        >
          <Typography variant="body" className="text-[16px] opacity-60">
            Enter your email
          </Typography>
          <Button className="text-sm font-bold" onClick={openWaitlistModal}>
            Get Early Access →
          </Button>
        </div>
      </div>
      <WaitlistModal />
    </div>
  );
};

export default Waitlist;
