import { useEffect, useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "../ui/sidebar";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { ROUTES } from "@/lib/constants/routes";
import { SquarePen } from "lucide-react";
import Typography from "../Typography/Typography";
import { useGetUserBotChatSessionsQuery } from "@/store/api";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { ICON_COLORS } from "@/app/(app)/spend-optimizer/SpendTransaction";
import { usePathname, useRouter } from "next/navigation";
import { useChatContext } from "@/contexts/ChatContext";
import { saveToSessionStorage } from "@/lib/utils/sessionStorage";
import { ChatSideBarSkeleton } from "../Loader/Loader";

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

const ChatSidebar = () => {
  const [open, setOpen] = useState(true);
  const {
    shouldConvertNewPathToSessionId,
    messages,
    disableTypingLoader,
    setShowContinueJourneyMessage,
    setCurrentMessageId,
  } = useChatContext();
  const { data, isFetching, refetch } = useGetUserBotChatSessionsQuery({});
  const { setMessages } = useChatContext();
  const pathname = usePathname();
  const sessionId = pathname?.split("/")?.at(-1);
  const router = useRouter();

  useEffect(() => {
    const sessionId = shouldConvertNewPathToSessionId;
    if (sessionId) {
      refetch?.();
    }
  }, [messages?.length]);

  const handleSessionClick = (session_id: string) => {
    if (typeof window === "undefined") return null;
    disableTypingLoader?.();
    localStorage.setItem("chat_session_id", session_id);
    localStorage.setItem("is_chat_session_id_valid", "true");
    setMessages([]);
    setShowContinueJourneyMessage(false);
  };

  const handleNewChat = () => {
    if (typeof window === "undefined") return null;
    disableTypingLoader?.();
    setMessages([]);
    setCurrentMessageId("card-category-fs");
    localStorage.removeItem("chat_session_id");
    localStorage.removeItem("is_chat_session_id_valid");
    setShowContinueJourneyMessage(false);
    router.push("/chat/new");
  };

  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody
        isVaraint2
        className="fixed z-100 justify-between bg-brown-sidebar gap-10 h-screen !w-[220px] px-2 pl-4"
      >
        <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
          {open ? <Logo /> : <LogoIcon />}
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
          <Typography
            variant="body"
            className="text-md text-primary-orange opacity-100 text-left mt-4 font-semibold"
          >
            Last 5 Matches
          </Typography>

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
                          sessionId === link?.session_id
                            ? "bg-brown-background overflow-hidden w-[190px] p-2 py-1 rounded-md border border-secondary-orange"
                            : ""
                        }
                      >
                        <SidebarLink
                          className="text-white"
                          labelClassName="text-xs font-semibold"
                          link={{
                            label: `${link?.title || link?.content}`,
                            href: `/chat/${link?.session_id}`,
                            icon: "",
                          }}
                        />
                      </div>
                    </div>
                  )
                )
            )}
          </div>
        </div>
      </SidebarBody>
    </Sidebar>
  );
};

export default ChatSidebar;
