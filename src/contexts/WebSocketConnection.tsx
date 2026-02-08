"use client";

import { PUBLIC_ROUTES, ROUTES } from "@/lib/constants/routes";
import useSocket from "@/lib/hooks/useSocket";
import useUserData from "@/lib/hooks/useUserData";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { useChatContext } from "./ChatContext";
import { useDelayed } from "@/lib/hooks/useDelay";
import { signOut, useSession } from "next-auth/react";
import { AUTH_STATE } from "@/lib/constants/auth";

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
  const { data: session, status } = useSession();

  useEffect(() => {
    if (!session && typeof window !== 'undefined' && !PUBLIC_ROUTES?.includes(pathname) && status === AUTH_STATE.UNAUTHENTICATED) {
      localStorage.clear()
      signOut({ callbackUrl: "/sign-in" });
    }
  }, [session]);
  

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
