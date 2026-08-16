"use client";
import { cardCategoryJourneyData } from "@/lib/constants/chatJourney";
import { CARD_CATEGORY_KEY } from "@/lib/constants/storage";
import { CARD_CATEGORY } from "@/lib/data/cards";
import { getFromSessionStorage } from "@/lib/utils/sessionStorage";
import { CardsType } from "@/types/card";
import {
  BaseMessage,
  ChatMessage,
  MESSAGE_SOURCE,
  MESSAGE_TYPE,
} from "@/types/chatMessages";
import { usePathname } from "next/navigation";
import React, {
  createContext,
  Dispatch,
  RefObject,
  SetStateAction,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

/**
 * A turn we have handed to the partner and are still waiting on. `content` is
 * kept so the retry CTA can re-send exactly what the user typed.
 */
export type PendingReply = {
  m_id: string;
  content: string;
  /** When the wait started, refreshed by inbound chunks for this turn. */
  startedAt: number;
};

export type ChatsTypes = {
  enableTypingLoader: () => void;
  disableTypingLoader: () => void;
  /** The turn awaiting a partner reply, or null when nothing is in flight. */
  pendingReply: PendingReply | null;
  setPendingReply: Dispatch<SetStateAction<PendingReply | null>>;
  /** The turn whose reply never arrived — drives the retry CTA. */
  timedOutReply: PendingReply | null;
  setTimedOutReply: Dispatch<SetStateAction<PendingReply | null>>;
  enableChatInput: () => void;
  disableChatInput: () => void;
  selectedCardCategory: string | null;
  selectedCardCategoryJourney: BaseMessage[];
  setCurrentMessageId: Dispatch<SetStateAction<string | undefined>>;
  setSelectedCardCategory: Dispatch<SetStateAction<string | null>>;
  journeyCurrentQuestion: BaseMessage;
  currentMessageIndex: number;
  setInputValue: Dispatch<SetStateAction<string>>;
  inputValue: string;
  showTypingLoader: boolean;
  currentMessageId: string | undefined;
  chatInputDisabled: boolean;
  messages: ChatMessage[];
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  showContinueJourneyMessage: boolean;
  setShowContinueJourneyMessage: Dispatch<SetStateAction<boolean>>;
  startFollowUp:RefObject<boolean>
};
const ChatContext = createContext<ChatsTypes | null>(null);

export function ChatContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showTypingLoader, setShowTypingLoader] = useState(false);
  const [pendingReply, setPendingReply] = useState<PendingReply | null>(null);
  const [timedOutReply, setTimedOutReply] = useState<PendingReply | null>(null);
  const [selectedCardCategory, setSelectedCardCategory] = useState<string | null>(
    () => getFromSessionStorage(CARD_CATEGORY_KEY) || CARD_CATEGORY.TRAVEL
  );

  const selectedCardCategoryJourney = useMemo(
    () => cardCategoryJourneyData?.[selectedCardCategory as CardsType],
    [selectedCardCategory]
  );

  const [currentMessageId, setCurrentMessageId] = useState(
    () => selectedCardCategoryJourney?.at(0)?.m_id
  );
  const [inputValue, setInputValue] = useState("");

  const [chatInputDisabled, setChatInputDisabled] = useState(true);

  const [showContinueJourneyMessage, setShowContinueJourneyMessage] =
    useState(false);
  const startFollowUp = useRef(false);
  const pathname = usePathname();

  const enableTypingLoader = () => setShowTypingLoader(true);
  const disableTypingLoader = () => setShowTypingLoader(false);

  const enableChatInput = () => setChatInputDisabled(false);
  const disableChatInput = () => setChatInputDisabled(true);

  const currentMessageIndex = useMemo(
    () =>
      selectedCardCategoryJourney?.findIndex(
        (msg) => msg.m_id === currentMessageId
      ),
    [currentMessageId]
  );

  const journeyCurrentQuestion = useMemo(() => {
    const currentQuestion: BaseMessage = selectedCardCategoryJourney?.at(
      currentMessageIndex
    ) || {
      m_id: "",
      content: "",
      source: MESSAGE_SOURCE.USER,
      type: MESSAGE_TYPE.TEXT,
      botContent: "",
    };

    return currentQuestion;
  }, [currentMessageIndex]);



  return (
    <ChatContext.Provider
      value={{
        enableTypingLoader,
        disableTypingLoader,
        pendingReply,
        setPendingReply,
        timedOutReply,
        setTimedOutReply,
        selectedCardCategory,
        selectedCardCategoryJourney,
        setCurrentMessageId,
        setSelectedCardCategory,
        enableChatInput,
        disableChatInput,
        journeyCurrentQuestion,
        currentMessageIndex,
        setInputValue,
        inputValue,
        showTypingLoader,
        currentMessageId,
        chatInputDisabled,
        messages,
        setMessages,
        showContinueJourneyMessage,
        setShowContinueJourneyMessage,
        startFollowUp
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);

  if (!context) {
    throw new Error("useChat must be used within ChatProvider");
  }

  return context;
}
