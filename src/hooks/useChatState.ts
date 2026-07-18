import { useCallback, useRef } from "react";
import {
  BaseMessage,
  ChatMessage,
  MESSAGE_SOURCE,
  SessionMessage,
} from "@/types/chatMessages";
import { useChatContext } from "@/contexts/ChatContext";
import { cardCategoryJourneyData } from "@/lib/constants/chatJourney";
import { BotRecommendationCreditCardProps, CardsType } from "@/types/card";
import { continueJourney } from "@/lib/constants/questions/common";
import { HISTORY_ACTIONS } from "@/lib/constants/actions";
import { CARD_CATEGORY } from "@/lib/data/cards";
import { useAddAssistantMessage } from "@/lib/hooks/useAddAssistantMessage";
import { useAppWebSocketConnection } from "@/contexts/WebSocketConnection";
import { safeParseJson } from "@/lib/utils/markdown";

type RecommendationPayload = {
  startMessage: string;
  cards: BotRecommendationCreditCardProps[];
  endMessage: string;
};

// A compact NL summary of the locally-computed recommendation, sent to the
// socket so the partner grounds follow-up answers on cards it never generated.
function summarizeRecommendation(jsonContent: string): string {
  const parsed = safeParseJson<RecommendationPayload>(jsonContent);
  const cards = parsed?.cards ?? [];
  if (!cards.length) return "No card recommendation was produced.";
  const lines = cards.map((c, i) => {
    const parts = [
      `${i + 1}. ${c.cardName}`,
      c.returnOnSpend ? `return on spend ${c.returnOnSpend}%` : "",
      c.annualFee ? `annual fee ${c.annualFee}` : "",
    ].filter(Boolean);
    return parts.join(", ");
  });
  return `Context — I recommended these cards to the user for their journey:\n${lines.join(
    "\n",
  )}\nAnswer the user's follow-up questions about these cards.`;
}

export function useChatState() {
  const {
    setMessages,
    setCurrentMessageId,
    setSelectedCardCategory,
    enableChatInput,
    disableChatInput,
    disableTypingLoader,
    startFollowUp,
    setShowContinueJourneyMessage,
  } = useChatContext();
  const { sendMessageToSocket } = useAppWebSocketConnection();

  // Holds the summary of the last locally-computed recommendation so the
  // follow-up transition can seed the socket with it before "Start the follow up".
  const followUpContextRef = useRef<string>("");

  // Hand the conversation off to the partner socket for free follow-up Q&A,
  // seeding it first with the locally-computed recommendation as context.
  const startSocketFollowUp = useCallback(() => {
    const context = followUpContextRef.current;
    setTimeout(() => {
      enableChatInput?.();
      setCurrentMessageId("");
      if (context) {
        sendMessageToSocket(
          JSON.stringify({
            source: "user",
            content: context,
            m_id: "recommendation-context",
            ts: new Date().toISOString(),
            type: "TextMessage",
            custom_metadata: [],
          }),
        );
      }
      sendMessageToSocket(
        JSON.stringify({
          source: "user",
          content: "Start the follow up",
          m_id: "start-follow-up",
          ts: new Date().toISOString(),
          type: "TextMessage",
          custom_metadata: [],
        }),
      );
      followUpContextRef.current = "";
    }, 2000);
  }, []);

  // Completion handler for messages that arrive over the socket (follow-up
  // replies, journey questions). Recommendation completion is handled
  // explicitly by injectLocalAssistantMessage below.
  const handleMessageComplete = useCallback((m_id: string) => {
    disableTypingLoader?.();
    setCurrentMessageId(m_id);
    enableChatInput();
  }, []);

  const { handleAssistantSocketMessage } = useAddAssistantMessage(setMessages, {
    onMessageComplete: handleMessageComplete,
  });

  // Inject a locally-computed recommendation (already a ```json block) as an
  // assistant message, bypassing the socket chunk path, then drive the correct
  // post-recommendation behavior based on the explicit `phase`:
  //   - "early": after the cards render, keep input disabled and show the
  //     "fine-tune?" prompt (No -> free follow-up, Yes -> phase-2 journey).
  //   - "end":  hand off to the partner socket for free follow-up Q&A.
  const injectLocalAssistantMessage = useCallback(
    (jsonContent: string, phase: "early" | "end") => {
      const m_id = crypto.randomUUID();
      disableTypingLoader?.();
      setMessages((prev) => [
        ...prev,
        {
          source: MESSAGE_SOURCE.ASSISTANT,
          type: "TextMessage",
          content: jsonContent,
          m_id,
          ts: new Date().toISOString(),
        } as BaseMessage,
      ]);

      // Keep the recommendation summary ready for whichever follow-up path
      // runs next (phase-2 "end", or "No, I am good" from the fine-tune prompt).
      followUpContextRef.current = summarizeRecommendation(jsonContent);

      if (phase === "early") {
        // Cards shown; keep input disabled and prompt to fine-tune.
        disableChatInput?.();
        addUserMessage(continueJourney as BaseMessage);
        setCurrentMessageId(continueJourney?.m_id);
        setShowContinueJourneyMessage(false);
      } else {
        startFollowUp.current = false;
        startSocketFollowUp();
      }
    },
    [startSocketFollowUp],
  );

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

  const addAssistantMessage = (msg: ChatMessage) => {
    handleAssistantSocketMessage(msg);
  };

  const loadHistory = useCallback((history: ChatMessage[]) => {
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
      (a, b) => new Date(a.ts ?? 0).getTime() - new Date(b.ts ?? 0).getTime(),
    );

    const selectedCategory = sorted
      ?.find(
        (message: BaseMessage) =>
          message?.source === MESSAGE_SOURCE.USER &&
          message?.custom_metadata?.length,
      )
      ?.custom_metadata?.find(
        (message: Record<string, string>) =>
          Object.keys(message)?.at(0) === "card-category-fs",
      )?.["card-category-fs"];

    const handleMessageMetadata = (
      metadata: Record<string, string>[],
      category: CardsType,
    ) => {
      const selectedCategoryData =
        cardCategoryJourneyData?.[category as CardsType];

      const formattedMessage = metadata
        ?.filter((ele) => Object.keys(ele)?.at(0) !== "action")
        ?.map((ele: Record<string, string>) => {
          const currentQuestion = selectedCategoryData?.find(
            (question) => question?.m_id === Object.keys(ele)?.at(0),
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
          return [
            { ...currentQuestion, selectedValue: Object.values(ele)?.at(0) },
            userMessage,
          ];
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
            selectedCategory as CardsType,
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
          message?.custom_metadata?.length,
      )
      ?.at(-1)
      ?.custom_metadata?.find(
        (ele) => Object.keys(ele)?.at(0) === "action",
      )?.action;

    let finalHistory = historyBuildUp?.flat();

    if (lastAction === HISTORY_ACTIONS.END_RECOMMENDATION) {
      setCurrentMessageId("");
      enableChatInput();
    } else if (lastAction === HISTORY_ACTIONS.EARLY_RECOMMENDATION) {
      const isFollowUp = finalHistory?.findIndex(
        (message) => message?.m_id === "start-follow-up",
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
      selectedCategory || (CARD_CATEGORY.TRAVEL as CardsType),
    );
    setMessages(finalHistory as BaseMessage[]);
  }, []);

  const setSessionIdValidation = useCallback((validation: boolean) => {
    if (typeof window === "undefined") return null;
    localStorage.setItem(
      "is_chat_session_id_valid",
      JSON.stringify(validation),
    );
  }, []);

  const clearProcessedChunks = useCallback(() => {
    processedChunks.current.clear();
  }, []);

  return {
    addUserMessage,
    addAssistantMessage,
    injectLocalAssistantMessage,
    startSocketFollowUp,
    loadHistory,
    clearProcessedChunks,
    setSessionIdValidation,
  };
}
