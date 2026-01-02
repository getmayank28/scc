import { MESSAGE_SOURCE, MESSAGE_TYPE } from "@/types/chatMessages";
import { CHAT_ACTIONS } from "../actions";

export const continueJourney = {
  m_id: "continueJourney",
  source: MESSAGE_SOURCE.ASSISTANT,
  content: "Should be move forward for the perfect card?",
  order: 4,
  type: MESSAGE_TYPE.BUTTON_GROUP,
  slots: [
    {
      label: "No, I am good",
      value: CHAT_ACTIONS.EVALUTE_RECOMMENDATION,
      variant: "outline",
    },
    {
      label: "I want the perfect card",
      value: CHAT_ACTIONS.CONTINUE_JOURNEY,
      variant: "primary",
    },
  ],
};
