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
import { useSocketReplyTimeout } from "@/lib/hooks/useSocketReplyTimeout";
import { useChatContext } from "@/contexts/ChatContext";
import { useAppWebSocketConnection } from "@/contexts/WebSocketConnection";
import { INPUT_MESSAGE_SOURCE } from "@/lib/constants/chatJourney";
import { CardSelectorSkeleton } from "@/components/Loader/Loader";
import { useAnalytics } from "@/lib/analytics/hooks/useAnalytics";
import { EventName } from "@/lib/analytics/types";
import { usePathname } from "next/navigation";

export default function ChatbotUI() {
  const { track } = useAnalytics();
  const pathname = usePathname();
  const sessionId = pathname?.split("/")?.at(-1) ?? "";

  const {
    selectedCardCategoryJourney,
    currentMessageId,
    showTypingLoader,
    inputValue,
    chatInputDisabled,
    setInputValue,
    messages,
    timedOutReply,
  } = useChatContext();

  const { addUserMessage, restoreLocalReplay } = useChatState();
  const messagesEndRef = useChatScroll(messages);
  const {
    handleSendMessage,
    handleKeyPressSendMessage,
    handleMessageFormatting,
    retryTimedOutMessage,
  } = useChatActions();

  // Release the screen if the partner goes quiet on a turn we sent.
  useSocketReplyTimeout();

  const { lastMessage, isSocketLoading, isChatLoading } =
    useAppWebSocketConnection();

  useEffect(() => {
    track(EventName.CHAT_SESSION_VIEWED, {
      sessionId,
      isNewSession: sessionId === "new",
    });
  }, [sessionId]);

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

  // Bootstrap the journey as soon as the screen is renderable. This must not
  // wait on the socket: a new chat holds the connection closed until the
  // journey produces a recommendation, so gating here would deadlock.
  //
  // A reload can land after a recommendation but before the partner has minted
  // a session id, in which case there is no history frame coming — restore from
  // the local stash first so the cards are not lost.
  useEffect(() => {
    if (messages.length || isChatLoading) return;

    if (restoreLocalReplay()) return;

    addUserMessage(
      selectedCardCategoryJourney?.at(0) as BaseMessage | undefined
    );
  }, [isChatLoading, messages?.length]);


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
      
      <div className="flex w-full mx-auto flex-col pl-[180px] max-md:pl-0 pt-16 h-screen bg-brown-background min-w-0">
        <CardSelectorSkeleton
          className={`${isChatLoading ? "inline" : "hidden"}`}
        />
        <LoggedInHeader />
        {/* Messages Area - Scrollable */}
        <ChatbotScrollableArea
          isSocketLoading={isChatLoading}
          currentMessageId={currentMessageId}
          messages={messages}
          handleSend={handleSendWrapper}
          messagesEndRef={messagesEndRef}
          isTyping={showTypingLoader}
          hasReplyTimedOut={!!timedOutReply}
          onRetryTimedOutReply={retryTimedOutMessage}
        />

        {/* Input Area - Fixed at Bottom */}
        <ChatbotInput
          // The journey drives `chatInputDisabled` on its own; the socket only
          // matters once the input is actually enabled, i.e. for free-text
          // follow-up, which is the one thing that needs the partner.
          disabled={
            chatInputDisabled ||
            showTypingLoader ||
            isChatLoading ||
            isSocketLoading
          }
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

