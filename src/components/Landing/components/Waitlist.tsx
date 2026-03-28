import Typography from "@/components/Typography/Typography";
import ColourfulText from "@/components/ui/colourful-text";
import { Spotlight } from "@/components/ui/spotlight-new";
import WaitlistModal from "./WaitlistModal";
import dynamic from "next/dynamic";
import EarlyAccessInput from "./EarlyAccessInput";
import { TerminalComponent } from "./Terminal";
import PeopleJoinedWaitlist from "./PeopleJoinedWaitlist";

const SeeItInActionModal = dynamic(() => import('@/components/SeeItInActionModal/SeeItInActionModal'), {
  ssr: false,
  loading: () => <p>Loading...</p>,
});

const Waitlist = () => {
  return (
    <div className="bg-black max-md:px-4 relative flex flex-col justify-center items-center h-screen max-md:h-auto overflow-hidden">
      <Spotlight />
      <div className="flex max-md:flex-col gap-10 max-md:gap-0 items-center justify-center w-full">
        <div className="relative z-10 max-md:h-auto max-md:gap-10 max-md:mt-[150px]">
          <Typography
            variant="h1"
            className="text-left opacity-100 max-md:hidden"
          >
            We analyze.
            <br />
            You <ColourfulText text="maximize" />
          </Typography>
          <Typography
            variant="h1"
            className="opacity-100 max-md:text-[60px] hidden max-md:block"
          >
            We analyze.
            <br />
            You <br/><ColourfulText text="maximize" />
          </Typography>
          <Typography
            variant="body"
            className="text-left max-md:text-center text-[18px] max-md:text-[20px] mt-4 opacity-70"
          >
            We analyze your spending and recommend the best cards  <br className="max-md:hidden" /> so you earn more rewards, cashback, and benefits.
          </Typography>
          <EarlyAccessInput />

          <div className="flex gap-2 max-md:flex-col max-md:gap-0">
          <SeeItInActionModal />
          <PeopleJoinedWaitlist/>
          </div>
        </div>
        <TerminalComponent />
      </div>
      <WaitlistModal />
    </div>
  );
};

export default Waitlist;
