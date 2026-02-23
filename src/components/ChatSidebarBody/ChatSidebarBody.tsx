import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { Home, SquarePen, X } from "lucide-react";
import Typography from "../Typography/Typography";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { ChatSideBarSkeleton } from "../Loader/Loader";
import useChatSidebar from "@/lib/hooks/useChatSidebar";
import useIsMobile from "@/lib/hooks/useIsMobile";
import useNav from "@/lib/hooks/useNav";

dayjs.extend(utc);

export const Logo = () => {
  return (
    <Link
      href="/home"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black"
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium whitespace-pre text-black dark:text-white"
      >
        <Image
          width={120}
          height={24}
          className="w-30 max-md:w-24"
          src="/logoWithTitle.svg"
          alt="logo"
        />
      </motion.span>
    </Link>
  );
};
export const LogoIcon = () => {
  return (
    <Link
      href="/home"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black"
    >
      <Image
        width={120}
        height={24}
        className="w-30 max-md:w-24"
        src="/logo.svg"
        alt="logo"
      />
    </Link>
  );
};
const ChatSidebarBody = ({ onClose }: { onClose?: () => void }) => {
  const { isMobile } = useIsMobile()
  const { handleNewChat, handleSessionClick, currentSessionId, data, isFetching } = useChatSidebar()

  const { goToHome } = useNav()

  return (
    <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
      <div className="flex justify-between items-center">
        <Logo />
        {
          isMobile && (
            <div className="bg-brown-background p-1 border border-brown-border" onClick={onClose}>
              <X color="#fff" size={20} />
            </div>
          )
        }

      </div>

      <div className="mt-8 flex flex-col gap-2">
        <div
          className="flex gap-2 items-center cursor-pointer"
          onClick={handleNewChat}
        >
          <SquarePen className="h-5 w-5 shrink-0 text-neutral-200" />
          <Typography variant="body" className="text-md opacity-100">
            New
          </Typography>
        </div>
      </div>
      {data?.sessions?.length && !isFetching ? <Typography
        variant="body"
        className="text-md text-primary-orange opacity-100 text-left mt-4 font-semibold"
      >
        Last 5 Matches
      </Typography> : <></>}

      <div className="mt-2 flex flex-col gap-2">
        {isFetching ? (
          <ChatSideBarSkeleton />
        ) : (
          data?.sessions
            ?.slice(0, 5)
            ?.map(
              (link: {
                session_id: string;
                timestamp: string;
                title: string;
                content: string;
              }) => (
                <div
                  key={link?.session_id}
                  className="flex gap-1 items-center"
                >
                  <div
                    onClick={() => handleSessionClick(link?.session_id)}
                    className={
                      currentSessionId === link?.session_id
                        ? "bg-brown-background overflow-hidden w-[190px] p-2 py-1 rounded-md border border-secondary-orange"
                        : ""
                    }
                  >
                    <Link
                      href={`/chat/${link?.session_id}`}
                      className="text-white text-xs font-semibold truncate"
                    // labelClassName="text-xs font-semibold"
                    // link={{
                    //   label: `${link?.title || link?.content}`,
                    //   href: `/chat/${link?.session_id}`,
                    //   icon: "",
                    // }}
                    >
                      {link?.title || link?.content}
                    </Link>
                  </div>
                </div>
              )
            )
        )}
      </div>
      <div className="mt-8 flex flex-col gap-2">
        <Typography
          variant="body"
          className="text-md text-primary-orange opacity-100 text-left font-semibold"
        >
          Navigation
        </Typography>
        <div
          className="flex gap-2 items-center cursor-pointer"
          onClick={goToHome}
        >
          <Home className="h-5 w-5 shrink-0 text-neutral-200" />
          <Typography variant="body" className="text-md opacity-100">
            Go to home
          </Typography>
        </div>
      </div>
    </div>
  );
};

export default ChatSidebarBody;