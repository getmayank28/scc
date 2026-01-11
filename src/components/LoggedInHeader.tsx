import { ChevronLeft } from "lucide-react";
import useNav from "@/lib/hooks/useNav";
import Image from "next/image";
import useIsMobile from "@/lib/hooks/useIsMobile";
import ProfileDropdown from "./Profile/Profile";

const LoggedInHeader = ({ showBack }: { showBack?: boolean }) => {
  const { goBack } = useNav();
  const { isMobile } = useIsMobile();

  return (
    <div
      className={`w-full border-b gap-2 items-center z-[19] shadow-2xl border-secondary-orange bg-background-primary px-6 max-md:px-2 h-16 flex ${showBack || isMobile ? "justify-between" : "justify-end"} fixed top-0 left-0`}
    >
      {(showBack || isMobile) && (
        <div
          className="flex gap-1 items-center cursor-pointer"
          onClick={goBack}
        >
          <ChevronLeft size={24} color="#fff" />
          <Image width={110} height={20} src="/logoWithTitle.svg" alt="logo" />
        </div>
      )}
      <div className="dark">
        <ProfileDropdown />
      </div>
    </div>
  );
};

export default LoggedInHeader;
