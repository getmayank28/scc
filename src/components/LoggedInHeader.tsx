import useNav from "@/lib/hooks/useNav";
import Image from "next/image";
import useIsMobile from "@/lib/hooks/useIsMobile";
import ProfileDropdown from "./Profile/Profile";
import { MobileSidebar } from "./ui/sidebar";
import { useState } from "react";
import ChatSidebarBody from "./ChatSidebarBody/ChatSidebarBody";
import { usePathname } from "next/navigation";

const LoggedInHeader = ({ showBack }: { showBack?: boolean }) => {
  const [open, setOpen] = useState(false);
  const { goToHome } = useNav();
  const { isMobile } = useIsMobile();
  const pathname = usePathname()

  const showMobileSidebar = pathname?.includes('/chat')

  return (
    <div
      className={`w-full bg-brown-background gap-2 items-center z-[19] shadow-2x px-6 max-md:px-2 h-16 flex ${showBack || isMobile ? "justify-between" : "justify-end"} fixed top-0 left-0`}
    >
      {(showBack || isMobile) && (
        <div
          className="flex gap-1 items-center cursor-pointer"

        >
          {/* <ChevronLeft size={24} color="#fff" /> */}
          {showMobileSidebar && <MobileSidebar open={open} setOpen={setOpen} className={`m-0 p-0 bg-transparent border-0`}>
            <div className="bg-black/30 w-full h-screen">
              <div className="p-6 pr-3 pl-4 border-r-2 border-brown-border bg-brown-sidebar max-w-[220px] h-screen">
                <ChatSidebarBody onClose={() => setOpen(false)} />
              </div>
            </div>
          </MobileSidebar>}
          <Image width={110} height={20} onClick={goToHome} src="/logoWithTitle.svg" alt="logo" />
        </div>
      )}
      <div className="dark mt-5 mr-0 max-md:mt-0">
        <ProfileDropdown />
      </div>
    </div>
  );
};

export default LoggedInHeader;
