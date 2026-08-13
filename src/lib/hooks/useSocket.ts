import { useChatSessionTokenMutation } from "@/store/api";
import { useMemo } from "react";
import { CHANNEL } from "../constants/channel";
import { getEncodedBotContext } from "../utils/chatContext";

const useSocket = () => {
  const [
    chatSessionTokenMutation,
    {
      isLoading: isCreatingChatSessionToken,
      error: creatingChatSessionTokenError,
    },
  ] = useChatSessionTokenMutation();

  const isLoading = useMemo(
    () => isCreatingChatSessionToken,
    [isCreatingChatSessionToken],
  );

  const error = useMemo(
    () => creatingChatSessionTokenError,
    [creatingChatSessionTokenError],
  );

  const getChatSessionId = () => {
    if (typeof window === "undefined") return null;

    const sessionId = localStorage.getItem("chat_session_id");

    if (!sessionId) {
      return null;
    }
    const isSessionIdValid = localStorage.getItem("is_chat_session_id_valid");

    if (!isSessionIdValid) {
      return null;
    }
    return sessionId;
  };

  const isExpired = (token: string) => {
    const { exp } = JSON.parse(atob(token.split(".")[1]));
    return Date.now() + 60 >= exp * 1000;
  };

  const createChatSessionToken = async () => {
    if (typeof window === "undefined") return;
    let token = localStorage.getItem("CHAT_SESSION_TOKEN");
    const isTokenExpired = token ? isExpired(token) : true;

    if (!token || isTokenExpired) {
      const tokenRes = await chatSessionTokenMutation({});
      token = tokenRes?.data?.token;
      localStorage.setItem("CHAT_SESSION_TOKEN", token || "");
    }

    return { token };
  };

  const getSocketUrl = async () => {
    const data = await createChatSessionToken();
    const sessionId = getChatSessionId();

    const token = data?.token;
    if (!token) {
      return null;
    }

    const prodUrl = "wss://studio.zijus.com/ws/sarathi-9720";

    const sessionIdString = sessionId ? `&session_id=${sessionId}` : "";

    // The agent reads `custom_data` once, when the connection is established —
    // it is never re-read and never returned. That is why we hold the socket
    // closed until a recommendation exists (see WebSocketConnection): this one
    // shot has to carry the journey the agent never saw.
    const context = getEncodedBotContext();
    const customDataString = context ? `&custom_data=${context}` : "";

    return `${prodUrl}?token=${token}${sessionIdString}${customDataString}&language=EN_US&channel=${CHANNEL.CARD_RECOMMENDATION}&is_audio=false`;
  };

  return { getSocketUrl, isLoading, error, createChatSessionToken };
};

export default useSocket;
