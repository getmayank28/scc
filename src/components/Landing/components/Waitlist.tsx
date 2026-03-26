import Typography from "@/components/Typography/Typography";
import ColourfulText from "@/components/ui/colourful-text";
import { Spotlight } from "@/components/ui/spotlight-new";
import WaitlistModal from "./WaitlistModal";
import dynamic from "next/dynamic";
import EarlyAccessInput from "./EarlyAccessInput";

const SeeItInActionModal = dynamic(() => import('@/components/SeeItInActionModal/SeeItInActionModal'), {
  ssr: false, 
  loading: () => <p>Loading...</p>,
});

const Waitlist = () => {
  return (
    <div className="bg-black max-md:px-4 relative flex flex-col justify-center items-center  h-screen overflow-hidden">
      <Spotlight />
      <div className="relative z-10 max-md:mb-10 max-md:h-auto max-md:pt-32 max-md:gap-10">
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
          We analyze your spending and recommend the best cards  <br className="max-md:hidden" /> so you earn more rewards, cashback, and benefits.
        </Typography>
        <EarlyAccessInput/>
        <SeeItInActionModal/>
      </div>
      <WaitlistModal />
    </div>
  );
};

export default Waitlist;
