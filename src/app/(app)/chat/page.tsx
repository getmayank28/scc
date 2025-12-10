"use client";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChatbotScrollableArea } from "@/components/ScrollableArea/ScrollableArea";
import ChatbotInput from "@/components/ChatbotInput/ChatbotInput";
import { useConnectWebSocketQuery } from "@/store/socket";
import {
  clearFromSessionStorage,
  getFromSessionStorage,
  WS_SESSION_KEY,
} from "@/lib/utils/sessionStorage";
import { useChatState } from "@/hooks/useChatState";
import { ChatMessage } from "@/types/chatMessages";
import { Button } from "@/components/ui/button";
import { LoaderThree } from "@/components/ui/loader";
import GreetUser from "@/components/GreetUser/GreetUser";

export default function ChatbotUI() {
  const [inputValue, setInputValue] = useState("");
  const [currentMessageId, setCurrentMessageId] = useState("");
  const [startChatLoader, setStartChatLoader] = useState(false);
  const {
    messages,
    addUserMessage,
    addAssistantMessage,
    loadHistory,
    setSession,
  } = useChatState();

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const token = getFromSessionStorage(WS_SESSION_KEY) ?? "";
  const { data: socketData, isLoading } = useConnectWebSocketQuery({
    language: "EN_US",
    isAudio: false,
    token,
  });
  const send = socketData?.send;
  const processedSocketMessages = useRef(new Set<string>());

  const isAssistantTyping =
    messages.length > 0 && messages[messages.length - 1]?.source === "user";

  useEffect(() => {
    if (!socketData?.messages) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    socketData.messages.forEach((msg: any, index: number) => {
      // Create a unique ID for each message in the socket array
      // Using combination of type, m_id, source, and index
      const socketMsgId = `${msg.type}-${msg.m_id}-${msg.source}-${index}-${msg.content?.substring(0, 10)}`;

      // Skip if we've already processed this exact message
      if (processedSocketMessages.current.has(socketMsgId)) {
        return;
      }

      // Mark as processed
      processedSocketMessages.current.add(socketMsgId);

      if (msg.type === "session") {
        setSession(msg);
        return;
      }

      if (msg.source === "assistant") {
        // Pass the unique chunk ID to track it
        addAssistantMessage(msg, socketMsgId);
        return;
      }

      if (msg.type === "history") {
        loadHistory(msg.messages);
        return;
      }
    });
  }, [socketData?.messages, addAssistantMessage, loadHistory, setSession]);

  useEffect(() => {
    const id = messages?.[messages?.length - 1]?.m_id;
    setCurrentMessageId(id);
  }, [messages?.length]);

  const showStartButton = useMemo(() => {
    const isLengthLessThan2 =
      socketData?.messages && socketData?.messages?.length <= 2;
     
    const isHistory =
      socketData?.messages &&  // @ts-expect-error this is a valid comparison
      socketData?.messages?.find((msg) => msg.type === "history")?.messages
        ?.length;

    if (isLengthLessThan2 === undefined) return undefined;
    if (isHistory === undefined) return undefined;
    return isLengthLessThan2 && !isHistory;
  }, [socketData?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  // useNavigationGuard({})
useEffect(() => {
  let timer: ReturnType<typeof setTimeout> | undefined;

  if (startChatLoader) {
    timer = setTimeout(() => {
      setStartChatLoader(false);
    }, 5000);
  }

  return () => {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
  };
}, [startChatLoader]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (value: string) => {
    if (!value.trim() || !send) return;

    const userMsg: ChatMessage = {
      content: value,
      m_id: crypto.randomUUID(),
      source: "user",
      search: false,
      type: "TextMessage",
    };

    addUserMessage(userMsg);
    send(userMsg);

    setInputValue("");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(inputValue);
    }
  };

  const handleClearChat = () => {
    clearFromSessionStorage(WS_SESSION_KEY);
    window.location.reload();
  };

  if (showStartButton === undefined) {
    return (
      <div className="bg-background-primary flex justify-center items-center w-full h-screen fixed border-2 border-white">
        <LoaderThree />
      </div>
    );
  }

  return (
    <>
      {showStartButton ? (
        <GreetUser
          component
          loading={startChatLoader}
          onClick={() => {
            setStartChatLoader(true);
            if (send) {
              send({
                content: "Hello",
                m_id: crypto.randomUUID(),
                source: "user",
                search: false,
                type: "TextMessage",
              });
            }
          }}
        />
      ) : (
        <div className="flex flex-col h-screen bg-[#111111]">
          {/* Header - Fixed */}
          <div className="p-4 flex justify-between items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="w-30 max-md:w-24"
              src="/logoWithTitle.svg"
              alt="logo"
            />
            <Button variant="outline" onClick={handleClearChat}>
              Clear chat
            </Button>
            {/* <button onClick={sendMessage} className="text-white">Clear Chat</button> */}
          </div>
          {/* Messages Area - Scrollable */}

          <ChatbotScrollableArea
            currentMessageId={currentMessageId}
            messages={messages}
            handleSend={handleSend}
            messagesEndRef={messagesEndRef}
            isTyping={isLoading || isAssistantTyping}
          />
          {/* Input Area - Fixed at Bottom */}
          <ChatbotInput
            inputValue={inputValue}
            onInputChange={setInputValue}
            onSend={() => handleSend(inputValue)}
            placeholder="Ask me anything..."
            onKeyPress={handleKeyPress}
            isTyping={isLoading || isAssistantTyping}
          />
        </div>
      )}
    </>
  );
}
