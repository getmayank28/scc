"use client";
import React, { useState, useEffect, useMemo } from "react";
import useWebSocket from "react-use-websocket";
import { ChatbotScrollableArea } from "@/components/ScrollableArea/ScrollableArea";
import ChatbotInput from "@/components/ChatbotInput/ChatbotInput";
import {
  clearFromSessionStorage,
  getFromSessionStorage,
  saveToSessionStorage,
  WS_SESSION_KEY,
} from "@/lib/utils/sessionStorage";
import { useChatState } from "@/hooks/useChatState";
import { Button } from "@/components/ui/button";
import useSocket from "@/lib/hooks/useSocket";
import { travelCard } from "@/lib/constants/questions/travelCard";
import { CARD_CATEGORY } from "@/lib/data/cards";
import {
  BaseMessage,
  HistoryMessage,
  MESSAGE_SOURCE,
  MESSAGE_TYPE,
} from "@/types/chatMessages";
import { useChatScroll } from "@/lib/hooks/useChatScroll";
import {
  createBotRecommendationContent,
  getMessageContent,
} from "@/lib/constants/content";
import { CHAT_ACTIONS } from "@/lib/constants/actions";
import { ActionTypes } from "@/types/actions";
import { continueJourney as continueJourneyMessage } from "@/lib/constants/questions/common";
import { CARD_CATEGORY_KEY } from "@/lib/constants/storage";
import useNav from "@/lib/hooks/useNav";
import { foodCard } from "@/lib/constants/questions/foodCard";
import { shoppingCard } from "@/lib/constants/questions/shoppingCard";
import { allRounderCard } from "@/lib/constants/questions/allRounderCard";
import { CardsType } from "@/types/card";

const cardData = {
  [CARD_CATEGORY.TRAVEL]: travelCard,
  [CARD_CATEGORY.FOOD]: foodCard,
  [CARD_CATEGORY.SHOPPING]: shoppingCard,
  [CARD_CATEGORY.ALL_ROUNDER]: allRounderCard,
} as Record<CardsType, BaseMessage[]>;

export default function ChatbotUI() {
  const [cardCategory, setCardCategory] = useState(() =>
    getFromSessionStorage(CARD_CATEGORY_KEY)
  );
  const selectedCardData = useMemo(
    () => cardData?.[cardCategory as CardsType],
    [cardCategory]
  );

  const [inputValue, setInputValue] = useState("");
  const [socketUrl, setSocketUrl] = useState<string | null>(null);
  const [showTypingLoader, setShowTypingLoader] = useState(false);
  const [chatInputDisabled, setChatInputDisabled] = useState(true);

  const [currentMessageId, setCurrentMessageId] = useState(
    () => selectedCardData?.at(0)?.m_id
  );
  const [jouneyMessageId, setJoruneyMessageId] = useState([
    selectedCardData?.at(0)?.m_id,
  ]);
  const { sendMessage, lastMessage, readyState } = useWebSocket(
    socketUrl ? socketUrl : null
  );
  const { messages, addUserMessage, addAssistantMessage, loadHistory } =
    useChatState();
  const { getSocketUrl } = useSocket();
  const messagesEndRef = useChatScroll(messages);
  const { goToCardCategory } = useNav();

  useEffect(() => {
    if (!cardCategory) {
      goToCardCategory();
    }
  }, []);

  useEffect(() => {
    const conectSocket = async () => {
      const baseUrl = await getSocketUrl();
      if (baseUrl) setSocketUrl(baseUrl);
    };
    conectSocket();
  }, []);

  useEffect(() => {
    if (!messages.length) {
      addUserMessage(selectedCardData?.at(0) as BaseMessage | undefined);
    }
  }, []);

  useEffect(() => {
    if (!lastMessage) return;
    let parsed;
    try {
      parsed = JSON.parse(lastMessage.data);
    } catch {
      console.error("Invalid JSON from socket:", lastMessage.data);
      return;
    }

    handleMessage(parsed);
  }, [lastMessage]);

  const getUserMessage = (messages: BaseMessage[]) => {
    const userMessage = messages?.filter(
      (msg) => msg.source === MESSAGE_SOURCE.USER
    );
    return userMessage;
  };

  const evaluateEarly = (messages: BaseMessage[]) => {
    setShowTypingLoader(true);
    addUserMessage({
      source: "user",
      content: "Show me now",
      m_id: crypto.randomUUID(),
      ts: new Date().toISOString(),
      type: "TextMessage",
    });

    const botMessage = createBotRecommendationContent(
      getUserMessage(messages),
      cardCategory as CardsType
    );
    sendMessage(JSON.stringify(botMessage));
  };

  const continueJourney = () => {
    const currentMessageIndex = selectedCardData?.findIndex(
      (msg) => msg.m_id === jouneyMessageId?.at(-1)
    );
    const currentQuestion: BaseMessage = selectedCardData?.at(
      currentMessageIndex
    ) || {
      m_id: "",
      content: "",
      source: MESSAGE_SOURCE.USER,
      type: MESSAGE_TYPE.TEXT,
      botContent: "",
    };

    const userMsg = {
      name: currentQuestion?.content,
      content: "Great, let's move forward",
      m_id: crypto.randomUUID(),
      source: MESSAGE_SOURCE.USER,
      type: "TextMessage",
      questionType: currentQuestion?.type,
      questionId: currentQuestion?.m_id,
      botContent: currentQuestion?.botContent,
    };

    if (currentMessageIndex + 1 < selectedCardData.length) {
      const nextQuestion = selectedCardData?.at(currentMessageIndex + 1)
        ? selectedCardData?.at(currentMessageIndex + 1)
        : { m_id: "" };
      addUserMessage(userMsg as BaseMessage);
      addUserMessage(nextQuestion as BaseMessage);
      setCurrentMessageId(nextQuestion?.m_id);
      setJoruneyMessageId((prev) => [...prev, nextQuestion?.m_id]);
    }
  };

  const switchToAllRounder = () => {
    saveToSessionStorage(CARD_CATEGORY_KEY, CARD_CATEGORY.ALL_ROUNDER);
    setCardCategory(CARD_CATEGORY.ALL_ROUNDER);
    const question = cardData?.[CARD_CATEGORY.ALL_ROUNDER]?.at(0);
    addUserMessage(question);
    setCurrentMessageId(question?.m_id);
    setJoruneyMessageId((prev) => [...prev, question?.m_id]);
  };

  const resolveDynamicFields = (
    question: BaseMessage,
    answers: BaseMessage[]
  ): BaseMessage => {
    if (!question.dynamicFileds?.length) return question;

    const resolvedQuestion: BaseMessage = { ...question };

    question.dynamicFileds.forEach((field) => {
      const filedValue = question[field];

      if (typeof filedValue === "function") {
        // @ts-expect-error some
        resolvedQuestion[field] = filedValue(answers);
      }
    });

    return resolvedQuestion;
  };

  const handleSend = async (
    value: string | Record<string, string | number>
  ) => {
    if (typeof value === "string" && !value.trim()) return;

    const actions = {
      [CHAT_ACTIONS.EVALUTE_RECOMMENDATION]: () => evaluateEarly(messages),
      [CHAT_ACTIONS.CONTINUE_JOURNEY]: continueJourney,
      [CHAT_ACTIONS.SWITCH_TO_ALL_ROUNDER]: switchToAllRounder,
    };

    const isButtonGroupAction =
      typeof value === "string" && value?.includes("action-");

    if (isButtonGroupAction) {
      actions[value as ActionTypes]?.();
      return;
    }
    const currentMessageIndex = selectedCardData?.findIndex(
      (msg) => msg.m_id === currentMessageId
    );

    const currentQuestion: BaseMessage = selectedCardData?.at(
      currentMessageIndex
    ) || {
      m_id: "",
      content: "",
      source: MESSAGE_SOURCE.USER,
      type: MESSAGE_TYPE.TEXT,
      botContent: "",
    };
    const contentMsg = getMessageContent({
      messageType: currentQuestion.type,
      inputValue: value,
      questions: currentQuestion.inputs,
    });

    const userMsg = {
      name: currentQuestion?.content,
      content: contentMsg,
      m_id: crypto.randomUUID(),
      source: MESSAGE_SOURCE.USER,
      type: MESSAGE_TYPE.TEXT,
      questionId: currentQuestion?.m_id,
      questionType: currentQuestion?.type,
      botContent: currentQuestion?.botContent,
    };
    // Add user message first
    addUserMessage(userMsg as BaseMessage);

    // Find next valid question to render
    let nextIndex = currentMessageIndex + 1;
    let nextQuestion = null;

    while (nextIndex < selectedCardData.length) {
      const potentialNextQuestion = selectedCardData[nextIndex];

      if (potentialNextQuestion?.conditionalRender) {
        // Check if condition is met
        const shouldRender = potentialNextQuestion.condition?.(
          getUserMessage([...messages, userMsg] as BaseMessage[])
        );

        if (shouldRender) {
          // Condition met, use this question
          nextQuestion = potentialNextQuestion;
          break;
        } else {
          // Condition not met, skip to next question
          nextIndex++;
          continue;
        }
      } else {
        // No conditional render, use this question
        nextQuestion = potentialNextQuestion;
        break;
      }
    }

    if (nextQuestion) {
      const resolvedQuestion = resolveDynamicFields(
        nextQuestion,
        getUserMessage([...messages, userMsg] as BaseMessage[])
      );
      addUserMessage(resolvedQuestion as BaseMessage);
      setCurrentMessageId(resolvedQuestion?.m_id);
      setJoruneyMessageId((prev) => [...prev, resolvedQuestion?.m_id]);
    } else if (nextIndex >= selectedCardData.length && readyState === 1) {
      // Reached the end of questions
      evaluateEarly?.([...messages, userMsg] as BaseMessage[]);
      setChatInputDisabled(false)
    }

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

  const handleMessage = (message: BaseMessage | HistoryMessage) => {
    if (message.type !== "history" && message.source === "assistant") {
      addAssistantMessage(message);
      // setCurrentMessageId(message?.m_id);
      setShowTypingLoader(false);
      if (jouneyMessageId.length < selectedCardData.length) {
        addUserMessage(continueJourneyMessage as BaseMessage);
        setCurrentMessageId(continueJourneyMessage?.m_id);
      }

      return;
    }

    if (message.type === "history") {
      loadHistory(message.messages);
      return;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background-primary">
      <div className="p-4 flex justify-end items-center">
        <Button variant="outline" onClick={handleClearChat}>
          Clear chat
        </Button>
      </div>

      {/* Messages Area - Scrollable */}
      <ChatbotScrollableArea
        currentMessageId={currentMessageId}
        messages={messages}
        handleSend={handleSend}
        messagesEndRef={messagesEndRef}
        isTyping={showTypingLoader}
      />

      {/* Input Area - Fixed at Bottom */}
      <ChatbotInput
        disabled={chatInputDisabled || showTypingLoader}
        inputValue={inputValue}
        onInputChange={setInputValue}
        onSend={() => handleSend(inputValue)}
        placeholder="Ask me anything..."
        onKeyPress={handleKeyPress}
       
      />
    </div>
  );
}
