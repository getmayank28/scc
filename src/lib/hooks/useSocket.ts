import {
  useChatSessionTokenMutation,
  useCreateChatSessionMutation,
  useUserChatSessionsMutation,
} from "@/store/api";
import { getAnonymousId } from "../utils/ananymous";
import { useMemo } from "react";

const useSocket = () => {
  const [
    createChatSessionMutation,
    { isLoading: isCreatingChatSession, error: creatingChatSessionError },
  ] = useCreateChatSessionMutation();

  const [
    chatSessionTokenMutation,
    {
      isLoading: isCreatingChatSessionToken,
      error: creatingChatSessionTokenError,
    },
  ] = useChatSessionTokenMutation();

  const [getUserSession] = useUserChatSessionsMutation();

  const isLoading = useMemo(
    () => isCreatingChatSession || isCreatingChatSessionToken,
    [isCreatingChatSession, isCreatingChatSessionToken]
  );

  const error = useMemo(
    () => creatingChatSessionError || creatingChatSessionTokenError,
    [creatingChatSessionError, creatingChatSessionTokenError]
  );

  const createChatSession = async () => {
    const anonId = getAnonymousId();

    let sessionId = localStorage.getItem("chat_session_id");

    if (!sessionId) {
      const response = await getUserSession(anonId);

      if (!response?.data?.sessions?.length) {
        const res = await createChatSessionMutation({ anonymousId: anonId });
        sessionId = res?.data?.sessionId;
      } else {
        sessionId = response?.data?.sessions?.at(0)?.sessionId;
      }

      if (sessionId) localStorage.setItem("chat_session_id", sessionId);
    }

    return { sessionId };
  };

  const isExpired = (token: string) => {
    const { exp } = JSON.parse(atob(token.split(".")[1]));
    return Date.now() + 60 >= exp * 1000;
  };

  const createChatSessionToken = async () => {
    let token = localStorage.getItem("CHAT_SESSION_TOKEN");
    const isTokenExpired = token ? isExpired(token) : true;

    const { sessionId } = await createChatSession();

    if (!token || isTokenExpired) {
      const tokenRes = await chatSessionTokenMutation(sessionId);
      token = tokenRes?.data?.token;
      localStorage.setItem("CHAT_SESSION_TOKEN", token || "");
    }

    return { token, sessionId };
  };

  const getSocketUrl = async () => {
    const data = await createChatSessionToken();
    const token = data?.token;
    const sessionId = data?.sessionId;

    if (!token || !sessionId) {
      return null;
    }

    const base = "wss://sarathi-9720-411951434462.us-central1.run.app/ws";
    return `${base}?token=${token}&sessionId=${sessionId}&language=EN_US&is_audio=false`;
  };

  return { getSocketUrl, isLoading, error };
};

export default useSocket;
