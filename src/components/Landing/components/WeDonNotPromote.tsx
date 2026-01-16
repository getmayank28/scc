import Typography from "@/components/Typography/Typography";
import { BadgeCheck } from "lucide-react";

const WeDonNotPromote = ({ hideFlare }: { hideFlare?: boolean }) => {
  return (
    <div className="pb-10 max-md:px-4 flex flex-col gap-4 bg-black">
      {!hideFlare && (
        <div className="relative opacity-80 pb-10">
          <div className="absolute inset-x-40 max-md:inset-x-10 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-[3px] w-3/4 blur-sm" />
          <div className="absolute inset-x-40 max-md:inset-x-10 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-px w-3/4" />
          <div className="absolute inset-x-80 max-md:inset-x-20 top-0 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-[3px] w-1/4 blur-sm" />
          <div className="absolute inset-x-80 max-md:inset-x-20 top-0 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-px w-1/4" />
        </div>
      )}
      { !hideFlare&&<Typography
        variant="body"
        className="text-[14px] max-md:text-[12px] font-semibold uppercase tracking-[3px] opacity-60"
      >
        We don&apos;t promote cards, we calculate returns
      </Typography>}
      <div className="flex gap-5 max-md:gap-2 justify-center items-center">
        <div className="border px-4 text-[12px] max-md:text-[10px] max-md:text-center flex gap-2 font-semibold justify-center items-center h-11 border-[#aaa]/30 rounded-full text-[#AAAAAA] ">
          <BadgeCheck className="max-md:hidden" size={18} />
          500+ Cards Compared
        </div>
        <div className="border px-4 text-[12px] max-md:text-[10px] max-md:text-center  flex gap-2 font-semibold justify-center items-center h-11 border-[#aaa]/30 rounded-full text-[#AAAAAA] ">
          <BadgeCheck className="max-md:hidden" size={18} />
          Unbiased Recommendations
        </div>
        <div className="border px-4 text-[12px] max-md:text-[10px] max-md:text-center flex gap-2 font-semibold justify-center items-center h-11 border-[#aaa]/30 rounded-full text-[#AAAAAA]">
          <BadgeCheck className="max-md:hidden" size={18} />
          Data Driven Analysis
        </div>
      </div>
    </div>
  );
};

export default WeDonNotPromote;
