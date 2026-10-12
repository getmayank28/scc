"use client";

import { useEffect, useRef } from "react";
import { ReadyState } from "react-use-websocket";
import { useChatContext } from "@/contexts/ChatContext";
import { useAppWebSocketConnection } from "@/contexts/WebSocketConnection";
import { SOCKET_REPLY_TIMEOUT_MS } from "@/lib/constants/chat";

/**
 * Fail a follow-up turn that the partner never answers.
 *
 * Nothing is rendered until the `FinalMessage` arrives (see
 * `useAddAssistantMessage`, `streamingDelay = 0`), so a partner that goes quiet
 * mid-turn leaves `showTypingLoader` armed and `chatInputDisabled` set with no
 * user-reachable escape. This watches the turn recorded in `pendingReply` and,
 * once it has gone unanswered for `SOCKET_REPLY_TIMEOUT_MS`, releases the UI and
 * hands the turn to `timedOutReply` for the retry CTA to re-send.
 *
 * The deadline is measured from `pendingReply.startedAt`, which inbound chunks
 * refresh — a reply that is merely slow keeps the wait alive.
 */
export const useSocketReplyTimeout = () => {
  const {
    pendingReply,
    setPendingReply,
    setTimedOutReply,
    disableTypingLoader,
    enableChatInput,
  } = useChatContext();
  const { readyState } = useAppWebSocketConnection();

  // Read through a ref so the effect can depend on `startedAt` alone and not
  // re-arm the timer on unrelated context renders.
  const pendingRef = useRef(pendingReply);
  pendingRef.current = pendingReply;

  useEffect(() => {
    if (!pendingReply) return;

    const elapsed = Date.now() - pendingReply.startedAt;
    const remaining = Math.max(0, SOCKET_REPLY_TIMEOUT_MS - elapsed);

    const timer = setTimeout(() => {
      const expired = pendingRef.current;
      // A reply may have landed between the last render and this tick.
      if (!expired || expired.m_id !== pendingReply.m_id) return;

      setPendingReply(null);
      setTimedOutReply(expired);
      disableTypingLoader();
      enableChatInput();
    }, remaining);

    return () => clearTimeout(timer);
  }, [pendingReply?.m_id, pendingReply?.startedAt]);

  // A dropped connection is a hang we can detect immediately — there is no
  // point holding the user for the rest of the window. `react-use-websocket`
  // reconnects underneath us, but this turn is already lost: the partner never
  // received it, or its reply died with the socket.
  useEffect(() => {
    if (!pendingReply) return;
    if (readyState === ReadyState.OPEN || readyState === ReadyState.CONNECTING) {
      return;
    }

    setPendingReply(null);
    setTimedOutReply(pendingReply);
    disableTypingLoader();
    enableChatInput();
  }, [readyState, pendingReply?.m_id]);
};

export default useSocketReplyTimeout;
