import { useEffect, useRef } from "react";
import { BaseMessage } from "@/types/chatMessages";

export function useChatScroll(messages: BaseMessage[]) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return endRef;
}
