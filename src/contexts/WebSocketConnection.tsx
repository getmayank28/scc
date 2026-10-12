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
import { usePendingReplay } from "@/lib/hooks/usePendingReplay";
import { useSocketReplaySync } from "@/lib/hooks/useSocketReplaySync";
import { NEW_SESSION_ID } from "@/lib/constants/chat";

type WebSocketContextType = {
  lastMessage: MessageEvent<string> | null;
  sendMessageToSocket: (message: string) => void;
  readyState: number;
  /** Partner connection not usable yet — gate follow-up chat on this. */
  isSocketLoading: boolean;
  /** Nothing renderable yet — gate the screen itself on this. */
  isChatLoading: boolean;
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
  const { refetch } = useGetUserBotChatSessionsQuery({}, {skip:true});
  const hasRecommendation = usePendingReplay();

  // A brand-new chat has no partner session yet — the guided journey runs
  // entirely on our side. Connecting before a recommendation exists would burn
  // the agent's one read of `custom_data` on an empty context, so hold the
  // socket closed until the journey produces something worth handing over.
  // Resumed sessions are the opposite case: connect immediately to fetch history.
  const isNewSession = sessionId === NEW_SESSION_ID;
  const shouldConnect =
    !isUserDataLoading &&
    (isNewSession ? hasRecommendation : !!sessionId);

    const getUrl = useCallback(async () => {
      const url = await getSocketUrl(); // this reads fresh sessionId from localStorage each time
      return url ?? "";
      // `hasRecommendation` participates because the context it gates is baked
      // into the URL at connect time.
    }, [sessionId, hasRecommendation]);


  const {
    lastMessage,
    sendMessage: sendMessageToSocket,
    readyState,
  } = useWebSocket(shouldConnect ? getUrl : null, {
    share: false,
    shouldReconnect: () => true,
    retryOnError: true,
  });

  // Hand the replay to the partner exactly once per connection, as soon as it
  // is open. It rides `custom_metadata`, which the partner stores and returns
  // verbatim in the history frame — that is what a later reload rebuilds from.
  useSocketReplaySync({ readyState, sendMessageToSocket });

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

        if(sessionId === NEW_SESSION_ID){
          refetch?.()
          router.replace(`${ROUTES.CHAT}/${newSessionId}`);
        
        }
       
      }
    } catch {
      console.log("Failed to parse session from socket")
    }
  }, [lastMessage]);
  

  // Two distinct "not ready" states, because the socket is now deliberately
  // absent for most of a new chat:
  //
  //  - isSocketLoading: the partner connection is not usable yet. Only gates
  //    things that actually need it (free-text follow-up).
  //  - isChatLoading:   we cannot render anything yet. During the guided
  //    journey no socket is expected, so this must NOT wait on one — gating the
  //    journey on the socket would leave a new chat blank forever.
  const socketLoading = isUserDataLoading || readyState !== ReadyState.OPEN;
  const chatLoading = isUserDataLoading || (!isNewSession && socketLoading);

  const isSocketLoading = useDelayed(socketLoading, 200) as boolean;
  const isChatLoading = useDelayed(chatLoading, 200) as boolean;

  return (
    <WebSocketContext.Provider
      value={{
        lastMessage,
        sendMessageToSocket,
        readyState,
        isSocketLoading,
        isChatLoading,
      }}
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
