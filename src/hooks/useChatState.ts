import { useCallback, useRef } from "react";
import {
  BaseMessage,
  ChatMessage,
  MESSAGE_SOURCE,
  SessionMessage,
} from "@/types/chatMessages";
import { useChatContext } from "@/contexts/ChatContext";
import { cardCategoryJourneyData } from "@/lib/constants/chatJourney";
import { CardsType } from "@/types/card";
import { continueJourney } from "@/lib/constants/questions/common";
import { HISTORY_ACTIONS } from "@/lib/constants/actions";
import { CARD_CATEGORY } from "@/lib/data/cards";

export function useChatState() {
  const {
    setMessages,
    setCurrentMessageId,
    setSelectedCardCategory,
    enableChatInput,
    shouldConvertNewPathToSessionId,
  } = useChatContext();

  // Track processed message chunks to avoid duplicates
  const processedChunks = useRef(new Set<string>());

  const addUserMessage = useCallback((msg: BaseMessage | undefined) => {
    if (!msg) return;
    setMessages((prev) => {
      const isExist = prev.some((item) => item.m_id === msg.m_id);
      if (isExist) return prev;
      else {
        return [...prev, msg];
      }
    });
  }, []);

  const messgaeTypes = ["SlotMessage", "SliderMessage"];

  const addAssistantMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => {
      // Find if this assistant message already exists
      const existingIndex = prev.findIndex(
        (m) => m.m_id === msg.m_id && m.source === "assistant"
      );

      if (
        existingIndex === -1 &&
        (messgaeTypes?.includes(msg.type) || msg?.content)
      ) {
        return [...prev, msg];
      }

      // Message exists, append the chunk
      return prev.map((m, index) => {
        if (index === existingIndex) {
          return {
            ...msg,
            content: m.content + (msg?.content ? msg.content : ""),
            ts: msg.ts,
          };
        }
        return m;
      });
    });
  }, []);

  const loadHistory = useCallback((history: ChatMessage[]) => {
    if (shouldConvertNewPathToSessionId) return;

    if (!history || !history.length) {
      setMessages([]);
      setCurrentMessageId("card-category-fs");
      return;
    }

    // Clear processed chunks when loading history
    processedChunks.current.clear();

    // Group messages by m_id and source to handle chunks
    const messageMap = new Map<string, ChatMessage>();

    history.forEach((m) => {
      const key = `${m.m_id}-${m.source}`;

      if (!messageMap.has(key)) {
        messageMap.set(key, { ...m });
      } else {
        const existing = messageMap.get(key)!;
        messageMap.set(key, {
          ...existing,
          content: existing.content + m.content,
          ts: m.ts,
        });
      }
    });

    // Sort by timestamp
    const sorted = Array.from(messageMap.values()).sort(
      (a, b) => new Date(a.ts ?? 0).getTime() - new Date(b.ts ?? 0).getTime()
    );

    const selectedCategory = sorted
      ?.find(
        (message: BaseMessage) =>
          message?.source === MESSAGE_SOURCE.USER &&
          message?.custom_metadata?.length
      )
      ?.custom_metadata?.find(
        (message: Record<string, string>) =>
          Object.keys(message)?.at(0) === "card-category-fs"
      )?.["card-category-fs"];

    const handleMessageMetadata = (
      metadata: Record<string, string>[],
      category: CardsType
    ) => {
      const selectedCategoryData =
        cardCategoryJourneyData?.[category as CardsType];

      const formattedMessage = metadata
        ?.filter((ele) => Object.keys(ele)?.at(0) !== "action")
        ?.map((ele: Record<string, string>) => {
          const currentQuestion = selectedCategoryData?.find(
            (question) => question?.m_id === Object.keys(ele)?.at(0)
          );

          const userMessage = {
            name: currentQuestion?.content,
            content: Object.values(ele)?.at(0),
            m_id: crypto.randomUUID(),
            source: "user",
            type: "TextMessage",
            questionId: Object.keys(ele)?.at(0),
            questionType: currentQuestion?.type,
            botContent: currentQuestion?.botContent,
          };
          return [currentQuestion, userMessage];
        });

      return formattedMessage;
    };

    const historyBuildUp = sorted?.map((message: BaseMessage) => {
      if (message?.source === MESSAGE_SOURCE.USER) {
        const metadata: Record<string, string>[] | undefined =
          message?.custom_metadata;

        if (metadata?.length) {
          const formattedMessage = handleMessageMetadata(
            metadata,
            selectedCategory as CardsType
          );
          return formattedMessage?.flat();
        }
        return message;
      }
      return message;
    });

    const lastAction = sorted
      ?.filter(
        (message) =>
          message?.source === MESSAGE_SOURCE.USER &&
          message?.custom_metadata?.length
      )
      ?.at(-1)
      ?.custom_metadata?.find(
        (ele) => Object.keys(ele)?.at(0) === "action"
      )?.action;

    let finalHistory = historyBuildUp?.flat();

    if (lastAction === HISTORY_ACTIONS.END_RECOMMENDATION) {
      setCurrentMessageId("");
      enableChatInput();
    } else if (lastAction === HISTORY_ACTIONS.EARLY_RECOMMENDATION) {
      const isFollowUp = finalHistory?.findIndex(
        (message) => message?.m_id === "start-follow-up"
      );

      if (isFollowUp !== -1) {
        finalHistory = [
          ...finalHistory?.slice(0, isFollowUp),
          continueJourney,
          ...finalHistory?.slice(isFollowUp + 1),
        ];
        enableChatInput();
        setCurrentMessageId("");
      } else {
        finalHistory?.push(continueJourney);
        setCurrentMessageId("continueJourney");
      }
    }
    setSelectedCardCategory(
      selectedCategory || (CARD_CATEGORY.TRAVEL as CardsType)
    );
    setMessages(finalHistory as BaseMessage[]);
  }, []);

  const setSessionId = useCallback((session: SessionMessage) => {
    if (typeof window === "undefined") return null;
    localStorage.setItem("chat_session_id", session?.session_id);
  }, []);

  const setSessionIdValidation = useCallback((validation: boolean) => {
    if (typeof window === "undefined") return null;
    localStorage.setItem(
      "is_chat_session_id_valid",
      JSON.stringify(validation)
    );
  }, []);

  const clearProcessedChunks = useCallback(() => {
    processedChunks.current.clear();
  }, []);

  return {
    addUserMessage,
    addAssistantMessage,
    loadHistory,
    setSessionId,
    clearProcessedChunks,
    setSessionIdValidation,
  };
}
