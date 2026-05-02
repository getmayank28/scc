import { useEffect, useState } from "react";
import { useGetUserBotChatSessionsQuery } from "@/store/api";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { usePathname, useRouter } from "next/navigation";
import { useChatContext } from "@/contexts/ChatContext";
import { trackEvent } from "../analytics/track";
import { EventName } from "../analytics/types";

dayjs.extend(utc);

const useChatSidebar = () => {
  const [open, setOpen] = useState(() => true);

  const {
    disableTypingLoader,
    setShowContinueJourneyMessage,
    setCurrentMessageId,
  } = useChatContext();
  const { data, isFetching } = useGetUserBotChatSessionsQuery({});
  const { setMessages } = useChatContext();
  const pathname = usePathname();
  const currentSessionId = pathname?.split("/")?.at(-1);
  const router = useRouter();

  const handleSessionClick = (session_id: string) => {
    if (typeof window === "undefined") return null;
    trackEvent(EventName.CHAT_SIDEBAR_SESSION_CLICKED, { sessionId: session_id });
    disableTypingLoader?.();
    localStorage.setItem("chat_session_id", session_id);
    localStorage.setItem("is_chat_session_id_valid", "true");
    setMessages([]);
    setShowContinueJourneyMessage(false);
  };

  const handleNewChat = () => {
    if (typeof window === "undefined") return null;
    trackEvent(EventName.CHAT_SIDEBAR_NEW_CHAT_CLICKED, {});
    disableTypingLoader?.();
    setMessages([]);
    setCurrentMessageId("card-category-fs");
    setShowContinueJourneyMessage(false);
    localStorage.removeItem("chat_session_id");
    localStorage.removeItem("is_chat_session_id_valid");
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
