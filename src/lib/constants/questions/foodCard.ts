import {
  BaseMessage,
  MESSAGE_SOURCE,
  MESSAGE_TYPE,
} from "@/types/chatMessages";
import { CHAT_ACTIONS } from "../actions";

export const foodCard = [
  {
    m_id: "online-food-order-frequency",
    source: MESSAGE_SOURCE.ASSISTANT,
    content: "How often do you order food online?",
    botContent: " my online food order frequency is  ",
    order: 1,
    type: MESSAGE_TYPE.SELECT,
    slots: [
      {
        label: "Rarely or never",
        value: "Rarely or never",
      },
      {
        label: "1–2 times a week",
        value: "1–2 times a week",
      },
      {
        label: "3–5 times a week",
        value: "3–5 times a week",
      },
      {
        label: "Almost daily",
        value: "Almost daily",
      },
    ],
  },
  {
    m_id: "dine-out-frequency",
    source: MESSAGE_SOURCE.ASSISTANT,
    content: "How often do you dine out at restaurants?",
    botContent: " my dine out at restaurants frequency is ",
    order: 2,
    type: MESSAGE_TYPE.SELECT,
    slots: [
      {
        label: "Rarely or never",
        value: "Rarely or never",
      },
      {
        label: "1–2 times a month",
        value: "1–2 times a month",
      },
      {
        label: "3–5 times a month",
        value: "3–5 times a month",
      },
      {
        label: "2-3 times Every week or more",
        value: "2-3 times Every week or more",
      },
    ],
  },
  {
    m_id: "food-dining-platform",
    source: MESSAGE_SOURCE.ASSISTANT,
    content: "Do you have a preferred platform for food & dining?",
    botContent: " preferred platform for food & dining is ",
    order: 3,
    type: MESSAGE_TYPE.SELECT,
    slots: [
      {
        label: "Zomato",
        value: "Zomato",
      },
      {
        label: "Swiggy",
        value: "Swiggy",
      },
      {
        label: "EazyDiner",
        value: "EazyDiner",
      },
      {
        label: "No preference",
        value: "No preference",
      },
    ],
  },
  {
    m_id: "opt-for-all-rounder-card",
    source: MESSAGE_SOURCE.ASSISTANT,
    content:
      "Your spending is not suitable for a food specific card, you should opt for an all rounder card",
    order: 4,
    type: MESSAGE_TYPE.BUTTON_GROUP,
    conditionalRender: true,
    condition: (answers: BaseMessage[]) => {
      const dineOutFrequency =
        answers?.find((item) => item.questionId === "dine-out-frequency")
          ?.content || "";
      const isRecommendAllRounder = [
        "1–2 times a month",
        "Rarely or never",
      ]?.includes(dineOutFrequency);
      return isRecommendAllRounder;
    },
    slots: [
      {
        label: "Yes, go for all roundet card",
        value: CHAT_ACTIONS.SWITCH_TO_ALL_ROUNDER,
        variant: "primary",
      },
      {
        label: "No, recommend me a travel card",
        value: "No, recommend me a travel card",
        variant: "outline",
      },
    ],
  },
  {
    m_id: "food-early-recommendation",
    source: MESSAGE_SOURCE.ASSISTANT,
    content:
      "I have 3 strong contenders, but 1  more minutes gets you THE perfect match!  Shall we dive deeper?",
    order: 4,
    type: MESSAGE_TYPE.BUTTON_GROUP,
    slots: [
      {
        label: "I want the perfect card",
        value: "I want the perfect card",
        variant: "primary",
      },
      {
        label: "Show me now",
        value: CHAT_ACTIONS.EVALUTE_RECOMMENDATION,
        variant: "outline",
      },
    ],
  },
  {
    m_id: "per-online-food-order",
    source: MESSAGE_SOURCE.ASSISTANT,
    content: "What is your average spend per online food order?",
    botContent: " my average spend per online food order is ",
    order: 5,
    type: MESSAGE_TYPE.SLIDER,
    default: 400,
    min: 150,
    max: 1500,
    step: 50,
  },
  {
    m_id: "dining-out-average-bill",
    source: MESSAGE_SOURCE.ASSISTANT,
    content: "What is your average bill when dining out?",
    botContent: " my average bill when dining out is ",
    order: 6,
    type: MESSAGE_TYPE.SLIDER,
    default: 2000,
    min: 500,
    max: 10000,
    step: 500,
  },
  {
    m_id: "preferred-food-platform",
    source: MESSAGE_SOURCE.ASSISTANT,
    content: "",
    order: 7,
    type: MESSAGE_TYPE.FORM,
    inputs: [
      {
        m_id: "preferred-dining-platform",
        source: MESSAGE_SOURCE.ASSISTANT,
        content: "Your preferred dining payment platform?",
        botContent: " my preferred dining payment platform is ",
        order: 7,
        type: MESSAGE_TYPE.SELECT,
        slots: [
          {
            label: "Swiggy Dine out",
            value: "Swiggy Dine out",
          },
          {
            label: "District",
            value: "District",
          },
          {
            label: "Eazy Dinner",
            value: "Eazy Dinner",
          },
          {
            label: "Others",
            value: "Others than Swiggy Dine out, District and Eazy Dinner",
          },
        ],
      },
      {
        m_id: "preferred-food-order-platform",
        source: MESSAGE_SOURCE.ASSISTANT,
        content: "Your preferred food order platform?",
        botContent: " my preferred food order platform is ",
        order: 7,
        type: MESSAGE_TYPE.SELECT,
        slots: [
          {
            label: "Swiggy",
            value: "Swiggy",
          },
          {
            label: "Zomato",
            value: "Zomato",
          },
          {
            label: "Others",
            value: "Other than swiggy and Zomato",
          },
        ],
      },
    ],
  },
];
