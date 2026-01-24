"use client";

import { ROUTES } from "@/lib/constants/routes";
import useSocket from "@/lib/hooks/useSocket";
import useUserData from "@/lib/hooks/useUserData";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { useChatContext } from "./ChatContext";
import useDebounce from "@/lib/hooks/useDebounce";
import { useDelayed } from "@/lib/hooks/useDelay";

type WebSocketContextType = {
  lastMessage: MessageEvent<string> | null;
  sendMessageToSocket: (message: string) => void;
  readyState: number;
  isSocketLoading:boolean
};

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketConnectionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [socketUrl, setSocketUrl] = useState<string | null>(null);
  const { getSocketUrl } = useSocket();
  const {
    lastMessage,
    sendMessage: sendMessageToSocket,
    readyState,
  } = useWebSocket(socketUrl, {
    share: true,
    shouldReconnect: () => true,
    retryOnError: true,
  });
  const pathname = usePathname();
  const { isUserDataLoading } = useUserData();
  const {shouldConvertNewPathToSessionId} = useChatContext()
  

  useEffect(() => {
    const conectSocket = async () => {
      const baseUrl = await getSocketUrl();
      if (baseUrl) setSocketUrl(baseUrl);
    };

    if (pathname?.includes(ROUTES.CHAT) && !isUserDataLoading && !shouldConvertNewPathToSessionId) {
      conectSocket();
    }
  }, [pathname]);

  const socketLoading = isUserDataLoading || readyState !== ReadyState.OPEN;
  const isSocketLoading = useDelayed(socketLoading,200) as boolean
  return (
    <WebSocketContext.Provider
      value={{ lastMessage, sendMessageToSocket, readyState, isSocketLoading}}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export function useAppWebSocketConnection() {
  const ctx = useContext(WebSocketContext);
  if (!ctx) {
    throw new Error("useAppWebSocket must be used inside WebSocketProvider");
  }
  return ctx;
}
