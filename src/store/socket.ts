import { BaseMessage } from "@/types/chatMessages";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const wsApi = createApi({
  reducerPath: "wsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/" }),
  endpoints: (builder) => ({
    connectWebSocket: builder.query<
      { messages: BaseMessage[]; send: (msg: BaseMessage) => void },
      { token: string; sessionId: string; language?: string; isAudio?: boolean }
    >({
      queryFn: () => ({ data: { messages: [], send: () => {} } }),

      async onCacheEntryAdded(
        { token, language = "EN_US", isAudio = false, sessionId },
        { updateCachedData, cacheEntryRemoved }
      ) {
        let socket: WebSocket | null = null;
        let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

        const WS_URL = `wss://sarathi-9720-411951434462.us-central1.run.app/ws?token=${token}&sessionId=${sessionId}&language=${language}&is_audio=${isAudio}`;

        const connect = () => {
          socket = new WebSocket(WS_URL);

          socket.onopen = () => {
            updateCachedData((draft) => {
              draft.send = (msg: BaseMessage) => {
                if (socket?.readyState === WebSocket.OPEN) {
                  socket.send(JSON.stringify(msg));
                } else {
                  console.warn("WebSocket not open, message dropped");
                }
              };
            });
          };

          socket.onmessage = (event) => {
            let parsed;
            try {
              parsed = JSON.parse(event.data);
            } catch {
              parsed = event.data;
            }

            updateCachedData((draft) => {
              draft.messages.push(parsed);
            });
          };

          socket.onclose = () => {
            reconnectTimer = setTimeout(connect, 3000);
          };

          socket.onerror = () => socket?.close();
        };

        connect();

        // Clean up
        await cacheEntryRemoved;
        if (reconnectTimer) clearTimeout(reconnectTimer);

        // @ts-expect-error close is exist on socket
        socket?.close?.();
      },
    }),
  }),
});

export const { useLazyConnectWebSocketQuery } = wsApi;
