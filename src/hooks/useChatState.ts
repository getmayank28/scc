import { useState, useCallback, useRef } from "react";
import { ChatMessage, SessionMessage } from "@/types/chatMessages";
import { WS_SESSION_KEY } from "@/lib/utils/sessionStorage";

export function useChatState() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionToken, setSessionToken] = useState("");

  // Track processed message chunks to avoid duplicates
  const processedChunks = useRef(new Set<string>());

  const addUserMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const addAssistantMessage = useCallback(
    (msg: ChatMessage, chunkId?: string) => {
      // If this specific chunk was already processed, skip it
      if (chunkId && processedChunks.current.has(chunkId)) {
        return;
      }

      // Mark this chunk as processed
      if (chunkId) {
        processedChunks.current.add(chunkId);
      }

      setMessages((prev) => {
        // Find if this assistant message already exists
        const existingIndex = prev.findIndex(
          (m) => m.m_id === msg.m_id && m.source === "assistant"
        );

        if (existingIndex === -1 && msg?.content) {
          // New assistant message, add it
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
    },
    []
  );

  const loadHistory = useCallback((history: ChatMessage[]) => {
    if (!history || !history.length) return;

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

    setMessages(sorted);
  }, []);

  const setSession = useCallback((session: SessionMessage) => {
    if (session.token) {
      setSessionToken(session.token);
      sessionStorage.setItem(WS_SESSION_KEY, session.token);
    }
  }, []);

  const clearProcessedChunks = useCallback(() => {
    processedChunks.current.clear();
  }, []);

  return {
    messages,
    sessionToken,
    addUserMessage,
    addAssistantMessage,
    loadHistory,
    setSession,
    clearProcessedChunks,
  };
}
