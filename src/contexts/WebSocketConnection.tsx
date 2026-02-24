"use client";

import { PUBLIC_ROUTES, ROUTES } from "@/lib/constants/routes";
import useSocket from "@/lib/hooks/useSocket";
import useUserData from "@/lib/hooks/useUserData";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { useDelayed } from "@/lib/hooks/useDelay";
import { signOut, useSession } from "next-auth/react";
import { AUTH_STATE } from "@/lib/constants/auth";
import { useGetUserBotChatSessionsQuery } from "@/store/api";

type WebSocketContextType = {
  lastMessage: MessageEvent<string> | null;
  sendMessageToSocket: (message: string) => void;
  readyState: number;
  isSocketLoading:boolean
};

const WebSocketContext = createContext<WebSocketContextType | null>(null);


export function WebSocketConnectionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Extract session id from path like /chat/20260224-338fe866-...
  const sessionId = pathname?.includes(ROUTES.CHAT) 
    ? pathname.split("/").pop() 
    : null;
    console.log("Provider sessionId:", sessionId); // how many times does this log?

  return (
    <WebSocketInner key={sessionId} sessionId={sessionId}>
      {children}
    </WebSocketInner>
  );
}

export function WebSocketInner({
  children,
  sessionId
}: {
  children: React.ReactNode;
  sessionId: string | null | undefined
}) {
  const { getSocketUrl } = useSocket();
  const pathname = usePathname();
  const router = useRouter()
  const { isUserDataLoading } = useUserData();
  const { data: session, status } = useSession();
  const shouldConnect = !!sessionId  && !isUserDataLoading 
  const { refetch } = useGetUserBotChatSessionsQuery({});

    const getUrl = useCallback(async () => {
      const url = await getSocketUrl(); // this reads fresh sessionId from localStorage each time
      return url ?? "";
    }, [sessionId]);


  const {
    lastMessage,
    sendMessage: sendMessageToSocket,
    readyState,
  } = useWebSocket(shouldConnect ? getUrl : null, {
    share: false,
    shouldReconnect: () => true,
    retryOnError: true,
  });

  useEffect(() => {
    if (!session && typeof window !== 'undefined' && !PUBLIC_ROUTES?.includes(pathname) && status === AUTH_STATE.UNAUTHENTICATED) {
      localStorage.clear()
      signOut({ callbackUrl: "/sign-in" });
    }
  }, [session]);

  useEffect(() => {
    if (!lastMessage?.data) return;
    
    try {
      const data = JSON.parse(lastMessage.data);
      const newSessionId = data?.session_id; 
      
      if (data?.type === "session" && newSessionId) {
        localStorage.setItem("chat_session_id", newSessionId);

        if(sessionId === "new"){
          refetch?.()
          router.replace(`${ROUTES.CHAT}/${newSessionId}`);
        
        }
       
      }
    } catch {
      console.log("Failed to parse session from socket")
    }
  }, [lastMessage]);
  

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
