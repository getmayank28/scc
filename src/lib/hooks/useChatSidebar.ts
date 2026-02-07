import { useEffect, useState } from "react";
import { useGetUserBotChatSessionsQuery } from "@/store/api";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { usePathname, useRouter } from "next/navigation";
import { useChatContext } from "@/contexts/ChatContext";

dayjs.extend(utc);

const useChatSidebar = () => {
  const [open, setOpen] = useState(() => true);

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
  const currentSessionId = pathname?.split("/")?.at(-1);
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

  return {
    handleNewChat,
    handleSessionClick,
    currentSessionId,
    data,
    isFetching,
    open,
    setOpen,
  };
};

export default useChatSidebar;
