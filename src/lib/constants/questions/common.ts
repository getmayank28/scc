import { MESSAGE_SOURCE, MESSAGE_TYPE } from "@/types/chatMessages";
import { CHAT_ACTIONS } from "../actions";
import { CARD_CATEGORY } from "@/lib/data/cards";

export const continueJourney = {
  m_id: "continueJourney",
  source: MESSAGE_SOURCE.ASSISTANT,
  content: "We’ve got a strong match- want to fine-tune it further?",
  order: 4,
  type: MESSAGE_TYPE.BUTTON_GROUP,
  slots: [
    {
      label: "No, I am good",
      value: CHAT_ACTIONS.END_JOURNEY,
      variant: "outline",
    },
    {
      label: "Yes, fine-tune it",
      value: CHAT_ACTIONS.CONTINUE_JOURNEY,
      variant: "primary",
    },
  ],
};

export const chooseCardCategory = {
  m_id: "card-category-fs",
  source: MESSAGE_SOURCE.ASSISTANT,
  content: "What type of card are you looking for?",
  order: 4,
  type: MESSAGE_TYPE.BUTTON_GROUP,
  slots: [
    {
      label: "Travel",
      value: `${CHAT_ACTIONS.SELECT_CARD_CATEGORY}%${CARD_CATEGORY.TRAVEL}`,
      variant: "outline",
    },
    {
      label: "Shopping",
      value: `${CHAT_ACTIONS.SELECT_CARD_CATEGORY}%${CARD_CATEGORY.SHOPPING}`,
      variant: "outline",
    },
    {
      label: "Food & Dining",
      value: `${CHAT_ACTIONS.SELECT_CARD_CATEGORY}%${CARD_CATEGORY.FOOD}`,
      variant: "outline",
    },
    {
      label: "All Rounder",
      value: `${CHAT_ACTIONS.SELECT_CARD_CATEGORY}%${CARD_CATEGORY.ALL_ROUNDER}`,
      variant: "outline",
    },
  ],
};
