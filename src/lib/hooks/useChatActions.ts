import { InputButtonGroupActionTypes } from "@/types/actions";
import useInputButtonGroupAction from "./useInputButtonGroupAction";
import { useChatContext } from "@/contexts/ChatContext";
import { filterUserMessage, getMessageContent } from "../utils/content";
import {
  BaseMessage,
  HistoryMessage,
  MESSAGE_SOURCE,
  MESSAGE_TYPE,
  SessionMessage,
} from "@/types/chatMessages";
import { useChatState } from "@/hooks/useChatState";
import { CHAT_ACTIONS, HISTORY_ACTIONS } from "../constants/actions";
import { MessageSourceType } from "@/types/card";
import { INPUT_MESSAGE_SOURCE } from "../constants/chatJourney";
import { useAppWebSocketConnection } from "@/contexts/WebSocketConnection";
import { trackEvent } from "../analytics/track";
import { EventName } from "../analytics/types";
import { ReadyState } from "react-use-websocket";

const useChatActions = () => {
  const buttonGroupInputActions = useInputButtonGroupAction();
  const {
    journeyCurrentQuestion,
    currentMessageIndex,
    selectedCardCategoryJourney,
    selectedCardCategory,
    setCurrentMessageId,
    disableChatInput,
    setInputValue,
    inputValue,
    messages,
    enableTypingLoader,
  } = useChatContext();
  const {
    addUserMessage,
    addAssistantMessage,
    loadHistory,
    setSessionIdValidation,
  } = useChatState();
  const { sendMessageToSocket, readyState } = useAppWebSocketConnection();

  const handleMessageFormatting = (
    message: BaseMessage | HistoryMessage | SessionMessage,
  ) => {
    if (
      message.type !== "history" &&
      message.type !== "session" &&
      message.source === "assistant"
    ) {
      addAssistantMessage(message);
      return;
    }

    if (message.type === "history") {
      loadHistory(message.messages);
      return;
    }
  };

  const handleButtonGroupInput = (
    value: string | Record<string, string | number>,
  ) => {
    const isButtonGroupAction =
      typeof value === "string" && value?.includes("action-");

    if (isButtonGroupAction) {
      const isActionHavingValue = value?.includes("%");
      const action = isActionHavingValue ? value?.split("%")?.at(0) : value;
      buttonGroupInputActions[action as InputButtonGroupActionTypes]?.({
        content: "Recommend me a card",
        selectedValue: value?.split("%")?.at(1),
      });
      return true;
    }

    return false;
  };

  const getNextJourneyQuestion = (userMsg: BaseMessage) => {
    let nextIndex = currentMessageIndex + 1;
    let nextQuestion = null;

    while (nextIndex < selectedCardCategoryJourney.length) {
      const potentialNextQuestion = selectedCardCategoryJourney[nextIndex];

      if (potentialNextQuestion?.conditionalRender) {
        // Check if condition is met
        const shouldRender = potentialNextQuestion.condition?.(
          filterUserMessage([...messages, userMsg] as BaseMessage[]),
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

    return { nextQuestion, nextIndex };
  };

  const resolveDynamicFields = (
    question: BaseMessage,
    answers: BaseMessage[],
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

  const handleSendMessage = async (
    value: string | Record<string, string | number>,
    messageSource?: MessageSourceType,
  ) => {
    if (typeof value === "string" && !value.trim()) return;

    if (messageSource === INPUT_MESSAGE_SOURCE.DIRECT) {
      // Free text is answered by the partner, and the socket is deliberately
      // closed until the journey has produced a recommendation. Sending now
      // would drop the message silently, so ignore it and leave the user's
      // text in the box.
      if (readyState !== ReadyState.OPEN) return;

      trackEvent(EventName.CHAT_MESSAGE_SENT, {
        messageSource: "direct",
        messageLength: typeof value === "string" ? value.length : 0,
      });
      const userMsg = {
        content: value,
        m_id: crypto.randomUUID(),
        source: MESSAGE_SOURCE.USER,
        type: MESSAGE_TYPE.TEXT,
        custom_metadata: [],
      };
      addUserMessage(userMsg as BaseMessage);
      sendMessageToSocket(JSON.stringify(userMsg));
      setSessionIdValidation(true);
      disableChatInput();
      setCurrentMessageId("");
      enableTypingLoader();
      setInputValue("");
      return;
    }
    const isButtonGroupInput = handleButtonGroupInput(value);

    if (isButtonGroupInput) {
      return;
    }

    const isSubmit =
      typeof journeyCurrentQuestion?.submit === "string" &&
      journeyCurrentQuestion?.submit?.includes("action-");

    const contentMsg = getMessageContent({
      messageType: journeyCurrentQuestion.type,
      inputValue: value,
      questions: journeyCurrentQuestion.inputs,
    });

    trackEvent(EventName.CHAT_JOURNEY_ANSWER_SUBMITTED, {
      questionId: journeyCurrentQuestion?.m_id ?? "",
      questionType: journeyCurrentQuestion?.type ?? "",
      category: selectedCardCategory ?? "",
    });

    const userMsg = {
      name: journeyCurrentQuestion?.content,
      content: contentMsg!,
      m_id: crypto.randomUUID(),
      source: MESSAGE_SOURCE.USER,
      type: MESSAGE_TYPE.TEXT,
      questionId: journeyCurrentQuestion?.m_id,
      questionType: journeyCurrentQuestion?.type,
      botContent: journeyCurrentQuestion?.botContent,
      // Keep the raw per-field FORM values so the local recommendation-input
      // assembler can read typed values (the concatenated content loses them).
      ...(journeyCurrentQuestion?.type === MESSAGE_TYPE.FORM &&
      typeof value === "object"
        ? { formValues: value }
        : {}),
    };

    // Add user message first
    addUserMessage(userMsg as BaseMessage);

    if (isSubmit) {
      // Phase-1 (early) recommendation. The fine-tune prompt is added
      // explicitly once the cards render (see injectLocalAssistantMessage).
      buttonGroupInputActions[
        journeyCurrentQuestion?.submit as InputButtonGroupActionTypes
      ]?.({
        updatedMessageState: [...messages, userMsg],
        action: HISTORY_ACTIONS.EARLY_RECOMMENDATION,
      });
      return;
    }

    const { nextQuestion, nextIndex } = getNextJourneyQuestion(
      userMsg as BaseMessage,
    );
    if (nextQuestion) {
      const resolvedQuestion = resolveDynamicFields(
        nextQuestion,
        filterUserMessage([...messages, userMsg] as BaseMessage[]),
      );
      addUserMessage(resolvedQuestion as BaseMessage);
      setCurrentMessageId(resolvedQuestion?.m_id);

      return;
    } else if (
      nextIndex >= selectedCardCategoryJourney.length
      // && readyState === 1
    ) {
      // Reached the end of questions
      buttonGroupInputActions?.[CHAT_ACTIONS.EVALUTE_RECOMMENDATION]?.({
        action: HISTORY_ACTIONS.END_RECOMMENDATION,
        updatedMessageState: [...messages, userMsg],
      });
      disableChatInput?.();
      return;
    }
  };

  const handleKeyPressSendMessage = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue, INPUT_MESSAGE_SOURCE.DIRECT);
    }
  };

  return {
    handleSendMessage,
    handleKeyPressSendMessage,
    handleMessageFormatting,
  };
};

export default useChatActions;
