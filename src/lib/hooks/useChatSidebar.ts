import { useEffect, useState } from "react";
import { useGetUserBotChatSessionsQuery } from "@/store/api";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { usePathname, useRouter } from "next/navigation";
import { useChatContext } from "@/contexts/ChatContext";
import { trackEvent } from "../analytics/track";
import { EventName } from "../analytics/types";
import { clearPendingReplay } from "../utils/chatContext";

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
    // The opened session brings its own replay in the history frame; a leftover
    // stash from another chat would otherwise be restored over it.
    clearPendingReplay();
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
    // Drop the previous journey's replay so the new chat starts with the socket
    // closed and cannot inherit stale context.
    clearPendingReplay();
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
