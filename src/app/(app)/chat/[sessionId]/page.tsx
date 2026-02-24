"use client";
import React, { useEffect } from "react";
import { ChatbotScrollableArea } from "@/components/ScrollableArea/ScrollableArea";
import ChatbotInput from "@/components/ChatbotInput/ChatbotInput";
import { useChatState } from "@/hooks/useChatState";
import { BaseMessage } from "@/types/chatMessages";
import { useChatScroll } from "@/lib/hooks/useChatScroll";
import LoggedInHeader from "@/components/LoggedInHeader";
import ChatSidebar from "@/components/ChatSidebar/ChatSidebar";
import useChatActions from "@/lib/hooks/useChatActions";
import { useChatContext } from "@/contexts/ChatContext";
import { useAppWebSocketConnection } from "@/contexts/WebSocketConnection";
import { INPUT_MESSAGE_SOURCE } from "@/lib/constants/chatJourney";
import { CardSelectorSkeleton } from "@/components/Loader/Loader";
import { useRouter } from "next/navigation";

export default function ChatbotUI() {
  const {
    selectedCardCategoryJourney,
    currentMessageId,
    showTypingLoader,
    inputValue,
    chatInputDisabled,
    setInputValue,
    messages,
  } = useChatContext();

  const { addUserMessage } = useChatState();
  const messagesEndRef = useChatScroll(messages);
  const {
    handleSendMessage,
    handleKeyPressSendMessage,
    handleMessageFormatting,
  } = useChatActions();

  const { lastMessage, isSocketLoading } = useAppWebSocketConnection();

  useEffect(() => {
    if (!lastMessage) return;
    let parsed;
    try {
      parsed = JSON.parse(lastMessage.data);
    } catch {
      console.error("Invalid JSON from socket:", lastMessage.data);
      return;
    }
    handleMessageFormatting(parsed);
  }, [lastMessage]);

  useEffect(() => {
    if (!messages.length && !isSocketLoading) {
      addUserMessage(
        selectedCardCategoryJourney?.at(0) as BaseMessage | undefined
      );
    }
  }, [isSocketLoading, messages?.length]);


  const handleSendWrapper = (
    value: string | Record<string, string | number>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _id?: string
  ) => {
    // Ignore id parameter and call handleSendMessage without messageSource
    // This will use the JOURNEY path by default
    handleSendMessage(value).catch(console.error);
  };

  return (
    <div className="flex">
      <ChatSidebar />
      
      <div className="flex w-full mx-auto flex-col pl-[180px] max-md:pl-0 pt-16 h-screen bg-brown-background">
        <CardSelectorSkeleton
          className={`${isSocketLoading ? "inline" : "hidden"}`}
        />
        <LoggedInHeader />
        {/* Messages Area - Scrollable */}
        <ChatbotScrollableArea
          isSocketLoading={isSocketLoading}
          currentMessageId={currentMessageId}
          messages={messages}
          handleSend={handleSendWrapper}
          messagesEndRef={messagesEndRef}
          isTyping={showTypingLoader}
        />

        {/* Input Area - Fixed at Bottom */}
        <ChatbotInput
          disabled={chatInputDisabled || showTypingLoader || isSocketLoading}
          inputValue={inputValue}
          onInputChange={setInputValue}
          onSend={() =>
            handleSendMessage(inputValue, INPUT_MESSAGE_SOURCE.DIRECT)
          }
          placeholder="Ask me anything..."
          onKeyPress={handleKeyPressSendMessage}
        />
      </div>
    </div>
  );
}

