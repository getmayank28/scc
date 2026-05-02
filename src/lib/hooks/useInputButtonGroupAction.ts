import { useChatContext } from "@/contexts/ChatContext";
import { CHAT_ACTIONS, HISTORY_ACTIONS } from "../constants/actions";
import {
  BaseMessage,
  ChatMessage,
  MESSAGE_SOURCE,
  MESSAGE_TYPE,
} from "@/types/chatMessages";
import { useChatState } from "@/hooks/useChatState";
import {
  createBotRecommendationContent,
  filterUserMessage,
} from "../utils/content";
import { CardsType } from "@/types/card";
import { saveToSessionStorage } from "../utils/sessionStorage";
import { CARD_CATEGORY_KEY } from "../constants/storage";
import { CARD_CATEGORY } from "../data/cards";
import { cardCategoryJourneyData } from "../constants/chatJourney";
import { useAppWebSocketConnection } from "@/contexts/WebSocketConnection";
import { HistoryActions } from "@/types/actions";
import { trackEvent } from "../analytics/track";
import { EventName } from "../analytics/types";

interface Args {
  content?: string;
  selectedValue?: string | undefined;
  updatedMessageState?: ChatMessage[];
  action?: HistoryActions;
}

const useInputButtonGroupAction = () => {
  const {
    enableTypingLoader,
    selectedCardCategory,
    selectedCardCategoryJourney,
    setCurrentMessageId,
    setSelectedCardCategory,
    enableChatInput,
    messages,
    startFollowUp,
  } = useChatContext();

  const { sendMessageToSocket } = useAppWebSocketConnection();

  const { addUserMessage, setSessionIdValidation } = useChatState();

  const continueJourney = () => {
    trackEvent(EventName.CHAT_CONTINUE_JOURNEY_CLICKED, {});
    const currentMessageIndex = selectedCardCategoryJourney?.findIndex(
      (msg) => msg.submit,
    );
    const currentQuestion: BaseMessage = selectedCardCategoryJourney?.at(
      currentMessageIndex,
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
      thread: 2,
    };

    if (currentMessageIndex + 1 < selectedCardCategoryJourney.length) {
      const nextQuestion = selectedCardCategoryJourney?.at(
        currentMessageIndex + 1,
      )
        ? selectedCardCategoryJourney?.at(currentMessageIndex + 1)
        : { m_id: "" };

      addUserMessage(userMsg as BaseMessage);
      addUserMessage(nextQuestion as BaseMessage);
      setCurrentMessageId(nextQuestion?.m_id);
    }
  };

  const evaluateEarly = (args: Args | undefined) => {
    trackEvent(EventName.CHAT_RECOMMENDATION_REQUESTED, {
      category: (selectedCardCategory as string) ?? "",
      action: args?.action ?? "early",
    });
    enableTypingLoader();

    if (args?.content) {
      addUserMessage({
        source: "user",
        content: args?.content || "Keep things ready for me.",
        m_id: crypto.randomUUID(),
        ts: new Date().toISOString(),
        type: "TextMessage",
      });
    }

    const botMessage = createBotRecommendationContent(
      filterUserMessage(args?.updatedMessageState || messages),
      selectedCardCategory as CardsType,
      args?.action,
    );

    sendMessageToSocket(JSON.stringify(botMessage));
    setSessionIdValidation(true);

    if (args?.action === HISTORY_ACTIONS.END_RECOMMENDATION) {
      startFollowUp.current = true;
    }
  };

  const switchToAllRounder = (args?: Args) => {
    trackEvent(EventName.CHAT_SWITCH_CATEGORY_CLICKED, {
      category: args?.selectedValue ?? CARD_CATEGORY.ALL_ROUNDER,
    });
    const category = args?.selectedValue ?? null;
    const switchTo = category?.trim().includes(" ")
      ? CARD_CATEGORY.ALL_ROUNDER
      : category || "";
    saveToSessionStorage(CARD_CATEGORY_KEY, switchTo);
    setSelectedCardCategory(switchTo);
    const question = cardCategoryJourneyData?.[switchTo as CardsType]?.at(
      category ? 1 : 0,
    );

    addUserMessage(question);
    setCurrentMessageId(question?.m_id);
  };

  const handleEndJourney = () => {
    trackEvent(EventName.CHAT_END_JOURNEY, {});
    enableTypingLoader?.();
    enableChatInput?.();
    setCurrentMessageId("");
    sendMessageToSocket(
      JSON.stringify({
        source: "user",
        content: "Start the follow up",
        m_id: "start-follow-up",
        ts: new Date().toISOString(),
        type: "TextMessage",
        custom_metadata: [],
      }),
    );
  };

  const selectCardCategory = (args?: Args) => {
    trackEvent(EventName.CHAT_CATEGORY_SELECTED, {
      category: args?.selectedValue ?? "",
    });
    switchToAllRounder(args);
  };

  return {
    [CHAT_ACTIONS.EVALUTE_RECOMMENDATION]: (args?: Args) => evaluateEarly(args),
    [CHAT_ACTIONS.CONTINUE_JOURNEY]: continueJourney,
    [CHAT_ACTIONS.SWITCH_TO_ALL_ROUNDER]: switchToAllRounder,
    [CHAT_ACTIONS.END_JOURNEY]: handleEndJourney,
    [CHAT_ACTIONS.SELECT_CARD_CATEGORY]: selectCardCategory,
  };
};

export default useInputButtonGroupAction;
