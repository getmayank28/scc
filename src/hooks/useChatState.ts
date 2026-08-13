import { useCallback, useRef } from "react";
import {
  BaseMessage,
  ChatMessage,
  MESSAGE_SOURCE,
} from "@/types/chatMessages";
import { useChatContext } from "@/contexts/ChatContext";
import { CardsType } from "@/types/card";
import { continueJourney } from "@/lib/constants/questions/common";
import { HISTORY_ACTIONS } from "@/lib/constants/actions";
import { CARD_CATEGORY } from "@/lib/data/cards";
import { useAddAssistantMessage } from "@/lib/hooks/useAddAssistantMessage";
import { safeParseJson } from "@/lib/utils/markdown";
import {
  buildReplayMetadata,
  buildReplaySummary,
  collectReplayAnswers,
  decodeReplayMetadata,
  restoreJourneyMessages,
  restoreRecommendationMessages,
  type RecommendationPayload,
} from "@/lib/utils/chatReplay";
import {
  getPendingReplay,
  releasePendingReplay,
  savePendingReplay,
} from "@/lib/utils/chatContext";
import { FOLLOW_UP_TRIGGER_MID } from "@/lib/constants/chat";


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

  // Open free follow-up Q&A.
  //
  // The recommendation context no longer travels as a fake user turn — it rides
  // the connection itself as `custom_data`. Releasing the replay is what opens
  // the socket at all (see `usePendingReplay`), so there is nothing to send
  // from here: the connection does not exist yet, and anything written now
  // would be dropped. `useSocketReplaySync` delivers the replay and the
  // follow-up trigger once the connection is actually open.
  const startSocketFollowUp = useCallback(() => {
    // The journey is over — whichever phase produced the last recommendation,
    // it is now final.
    releasePendingReplay();
    enableChatInput?.();
    setCurrentMessageId("");
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
  //
  // This is also the point where the session becomes persistable: the journey
  // answers and the recommendation are stashed as a replay payload, which both
  // unblocks the socket connection (see `WebSocketConnection`) and is what a
  // later reload rebuilds the screen from.
  const injectLocalAssistantMessage = useCallback(
    (
      jsonContent: string,
      phase: "early" | "end",
      journeyMessages: BaseMessage[],
      category: CardsType,
    ) => {
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

      const action =
        phase === "early"
          ? HISTORY_ACTIONS.EARLY_RECOMMENDATION
          : HISTORY_ACTIONS.END_RECOMMENDATION;

      const recommendation =
        safeParseJson<RecommendationPayload>(jsonContent) ?? null;
      const answers = collectReplayAnswers(journeyMessages, action);

      // Phase 2 answers only cover the fine-tuning questions, so keep the
      // phase-1 result alongside them — it is the recommendation the user
      // actually saw first, and the agent needs both to explain any change.
      const earlierRecommendation =
        phase === "end" ? (getPendingReplay()?.recommendation ?? null) : null;

      savePendingReplay({
        category,
        summary: buildReplaySummary(category, answers),
        recommendation,
        earlierRecommendation,
        // A phase-1 result is provisional: the user is about to be asked
        // whether to fine-tune, and phase 2 would supersede it. Hold it back
        // until the journey actually ends.
        released: phase === "end",
        metadata: buildReplayMetadata({
          category,
          answers,
          recommendation,
          earlierRecommendation,
          action,
        }),
      });

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

  /**
   * Re-render a journey from the locally stashed replay.
   *
   * Covers the window between "cards are on screen" and "the partner has minted
   * a session id": during it there is no server-side history to reload from, so
   * a refresh would otherwise drop the recommendation the user just received.
   * Returns false when there is nothing stashed.
   */
  const restoreLocalReplay = useCallback(() => {
    const pending = getPendingReplay();
    const replay = decodeReplayMetadata(pending?.metadata);
    if (!replay) return false;

    const restored = [
      ...restoreJourneyMessages(replay),
      ...restoreRecommendationMessages(replay),
    ];
    if (!restored.length) return false;

    setSelectedCardCategory(
      replay.category || (CARD_CATEGORY.TRAVEL as CardsType),
    );

    if (replay.action === HISTORY_ACTIONS.EARLY_RECOMMENDATION) {
      // The fine-tune prompt was still on screen when the page went away.
      setMessages([...restored, continueJourney as BaseMessage]);
      setCurrentMessageId("continueJourney");
      disableChatInput();
    } else {
      setMessages(restored);
      setCurrentMessageId("");
      enableChatInput();
    }

    return true;
  }, []);

  /**
   * Rebuild the chat from the partner's `history` frame.
   *
   * The journey and its recommendation are computed locally and never travel
   * over the socket as ordinary messages, so they are restored from the replay
   * payload we stash in `custom_metadata` (see `lib/utils/chatReplay.ts`).
   * Everything else in the frame is genuine follow-up conversation and is
   * replayed as-is, in timestamp order, after the restored journey.
   */
  const loadHistory = useCallback((history: ChatMessage[]) => {
    if (!history || !history.length) {
      // An empty frame can arrive before our replay turn has been stored, so
      // fall back to the local stash rather than blanking a journey the user
      // can still see.
      if (restoreLocalReplay()) return;

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

    // The replay lives on the synthetic message we sent once, right after the
    // socket opened. Later phases overwrite earlier ones, so take the last.
    const replay = sorted
      .filter((message) => message?.custom_metadata?.length)
      .map((message) => decodeReplayMetadata(message.custom_metadata))
      .filter(Boolean)
      .at(-1);

    // No replay in the frame: either our turn has not landed yet (use the local
    // stash) or this session never got past the journey (start fresh).
    if (!replay) {
      if (restoreLocalReplay()) return;

      setMessages([]);
      setCurrentMessageId("card-category-fs");
      return;
    }

    const journeyMessages = restoreJourneyMessages(replay);
    const recommendationMessages = restoreRecommendationMessages(replay);

    // Follow-up conversation: everything that is not the synthetic replay
    // carrier and not our own seeded control turns. The empty-content check
    // also covers the carrier turn itself should its metadata ever come back
    // stripped — it would otherwise render as a blank bubble.
    const followUpMessages = sorted.filter(
      (message) =>
        !message?.custom_metadata?.length &&
        message?.m_id !== FOLLOW_UP_TRIGGER_MID &&
        !!message?.content?.trim(),
    );

    const finalHistory: BaseMessage[] = [
      ...journeyMessages,
      ...recommendationMessages,
    ];

    if (replay.action === HISTORY_ACTIONS.EARLY_RECOMMENDATION) {
      // Phase 1 ended with the "want to fine-tune?" prompt. If the user had
      // already moved on to free follow-up, the prompt is spent — show the
      // conversation and re-enable input instead of re-asking.
      if (followUpMessages.length) {
        finalHistory.push(continueJourney as BaseMessage, ...followUpMessages);
        setCurrentMessageId("");
        enableChatInput();
      } else {
        finalHistory.push(continueJourney as BaseMessage);
        setCurrentMessageId("continueJourney");
        disableChatInput();
      }
    } else {
      // Phase 2 / end: the conversation is in free follow-up.
      finalHistory.push(...followUpMessages);
      setCurrentMessageId("");
      enableChatInput();
    }

    setSelectedCardCategory(
      replay.category || (CARD_CATEGORY.TRAVEL as CardsType),
    );
    setMessages(finalHistory);
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
    restoreLocalReplay,
    clearProcessedChunks,
    setSessionIdValidation,
  };
}
