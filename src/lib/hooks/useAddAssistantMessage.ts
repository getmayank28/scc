import {
  BaseMessage,
  ChatMessage,
  MessageSource,
  MessageType,
} from "@/types/chatMessages";

import {
  useRef,
  useCallback,
  useEffect,
  Dispatch,
  SetStateAction,
} from "react";

interface PendingMessage {
  source: MessageSource;
  type: MessageType;
  m_id: string;
  chunks: string[];
  latestTs: string | undefined;
}

interface UseAddAssistantMessageOptions {
  streamingDelay?: number; // Delay between streaming updates (0 = no streaming)
  finalMessageDelay?: number; // Delay after FinalMessage to catch trailing chunks
  messageTypes?: string[]; // Valid message types to process
  onMessageComplete?: (m_id: string) => void;
  onAppendMessageAfterComplete?: (
    messages: ChatMessage[],
    m_id: string,
  ) => ChatMessage[];
}

export const useAddAssistantMessage = (
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>,
  options: UseAddAssistantMessageOptions = {},
) => {
  const {
    streamingDelay = 0,
    finalMessageDelay = 150,
    messageTypes = ["SlotMessage", "SliderMessage"], // Default types
    onMessageComplete,
    onAppendMessageAfterComplete,
  } = options;

  const pendingChunksRef = useRef<Record<string, PendingMessage>>({});
  const updateTimersRef = useRef<Record<string, NodeJS.Timeout>>({});
  const finalMessageTimersRef = useRef<Record<string, NodeJS.Timeout>>({});

  const flushMessage = useCallback(
    (m_id: string, isFinal: boolean = false) => {
      const pendingMessage = pendingChunksRef.current[m_id];

      if (!pendingMessage) return;

      const fullContent = pendingMessage.chunks.join("");

      setMessages((prev) => {
        const existingIndex = prev.findIndex(
          (m) => m.m_id === m_id && m.source === "assistant",
        );

        const message: BaseMessage = {
          source: pendingMessage.source,
          type: pendingMessage.type,
          content: fullContent,
          m_id: m_id,
          ts: pendingMessage.latestTs,
        };

        let next = [...prev];

        if (existingIndex === -1) {
          next.push(message);
        } else {
          next[existingIndex] = message;
        }

        if (isFinal && onAppendMessageAfterComplete) {
          next = onAppendMessageAfterComplete(next, m_id);
        }

        return next;
      });

      // Clean up on final flush
      if (isFinal) {
        delete pendingChunksRef.current[m_id];
        onMessageComplete?.(m_id);
      }
    },
    [setMessages, onMessageComplete, onAppendMessageAfterComplete],
  );

  const handleAssistantSocketMessage = useCallback(
    (msg: BaseMessage) => {
      const { m_id, type, content, source, ts } = msg;

      // Handle FinalMessage
      if (type === "FinalMessage") {
        // Cancel any pending streaming updates
        if (updateTimersRef.current[m_id]) {
          clearTimeout(updateTimersRef.current[m_id]);
          delete updateTimersRef.current[m_id];
        }

        // Clear any existing final timer
        if (finalMessageTimersRef.current[m_id]) {
          clearTimeout(finalMessageTimersRef.current[m_id]);
        }

        // Schedule final flush with delay to catch trailing chunks
        finalMessageTimersRef.current[m_id] = setTimeout(() => {
          flushMessage(m_id, true);
          delete finalMessageTimersRef.current[m_id];
        }, finalMessageDelay);

        return;
      }

      // Check if message type is valid and has content
      const isValidType = messageTypes.includes(type);
      const hasContent =
        content !== undefined && content !== null && content !== "";

      if (!isValidType && !hasContent) {
        return; // Ignore invalid message types without content
      }

      // Handle valid message chunks
      if (isValidType || hasContent) {
        // Initialize or append to pending chunks
        if (!pendingChunksRef.current[m_id]) {
          pendingChunksRef.current[m_id] = {
            source,
            type,
            m_id,
            chunks: [],
            latestTs: ts,
          };
        }

        // Add content if it exists
        if (hasContent) {
          pendingChunksRef.current[m_id].chunks.push(content);
        }

        pendingChunksRef.current[m_id].latestTs = ts;

        // Handle streaming updates if enabled
        if (streamingDelay > 0) {
          // Clear existing timer
          if (updateTimersRef.current[m_id]) {
            clearTimeout(updateTimersRef.current[m_id]);
          }

          // Schedule debounced update
          updateTimersRef.current[m_id] = setTimeout(() => {
            flushMessage(m_id, false);
            delete updateTimersRef.current[m_id];
          }, streamingDelay);
        }
      }
    },
    [flushMessage, streamingDelay, finalMessageDelay, messageTypes],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(updateTimersRef.current).forEach(clearTimeout);
      Object.values(finalMessageTimersRef.current).forEach(clearTimeout);
      pendingChunksRef.current = {};
    };
  }, []);

  return {
    handleAssistantSocketMessage,
    flushMessage: (m_id: string) => flushMessage(m_id, true),
    clearPendingMessage: (m_id: string) => {
      if (updateTimersRef.current[m_id]) {
        clearTimeout(updateTimersRef.current[m_id]);
        delete updateTimersRef.current[m_id];
      }
      if (finalMessageTimersRef.current[m_id]) {
        clearTimeout(finalMessageTimersRef.current[m_id]);
        delete finalMessageTimersRef.current[m_id];
      }
      delete pendingChunksRef.current[m_id];
    },
    getPendingCount: () => Object.keys(pendingChunksRef.current).length,
  };
};
