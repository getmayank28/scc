import {
  BaseMessage,
  MESSAGE_SOURCE,
  MESSAGE_TYPE,
} from "@/types/chatMessages";
import { CHAT_ACTIONS } from "../actions";
import { chooseCardCategory } from "./common";

export const allRounderCard = [
  chooseCardCategory,
  {
    m_id: "monthly-spend",
    source: MESSAGE_SOURCE.ASSISTANT,
    content:
      "About how much do you spend in a typical month (online + offline)?",
    botContent: " my monthly spend is ",
    order: 1,
    type: MESSAGE_TYPE.SLIDER,
    default: 50000,
    min: 1000,
    max: 200000,
    step: 1000,
  },
  {
    m_id: "online-spend",
    source: MESSAGE_SOURCE.ASSISTANT,
    content: "Out of this, roughly how much is spent online?",
    botContent: " my monthly online spend is ",
    order: 2,
    type: MESSAGE_TYPE.SLIDER,
    dynamicFileds: ["default", "max"],
    default: (answers: BaseMessage[]) => {
      const requiredQuestion = answers?.find(
        (item: BaseMessage) => item?.questionId === "monthly-spend",
      );
      return Number(requiredQuestion?.content) * 0.6;
    },
    min: 1000,
    max: (answers: BaseMessage[]) => {
      const requiredQuestion = answers?.find(
        (item: BaseMessage) => item?.questionId === "monthly-spend",
      );
      return Number(requiredQuestion?.content);
    },
    step: 1000,
  },
  {
    m_id: "most-spend-category",
    source: MESSAGE_SOURCE.ASSISTANT,
    content: "Which categories do you spend the most on? (Select up to 2)",
    botContent: " categories I spend the most on is ",
    order: 3,
    type: MESSAGE_TYPE.MULTI_SELECT,
    submit: CHAT_ACTIONS.EVALUTE_RECOMMENDATION,
    maxSelect: 2,
    slots: [
      {
        label: "Travel",
        value: "Travel",
      },
      {
        label: "Food & Dining",
        value: "Food & Dining",
      },
      {
        label: "Online Shopping",
        value: "Online Shopping",
      },
      {
        label: "Utility Bills",
        value: "Utility Bills",
      },
      {
        label: "Fuel",
        value: "Fuel",
      },
      {
        label: "Rent / Insurance / Fees",
        value: "Rent / Insurance / Fees",
      },
    ],
  },
  {
    m_id: "yearly-travel-spend",
    source: MESSAGE_SOURCE.ASSISTANT,
    content: "Roughly how much do you spend on travel in a year?",
    botContent: " my travel spend in a year is ",
    order: 5,
    type: MESSAGE_TYPE.SLIDER,
    default: 100000,
    min: 0,
    max: 1000000,
    step: 1000,
  },
  {
    m_id: "food-bills-shopping",
    source: MESSAGE_SOURCE.ASSISTANT,
    content: "",
    type: MESSAGE_TYPE.FORM,
    inputs: [
      {
        m_id: "food-and-dining",
        source: MESSAGE_SOURCE.ASSISTANT,
        content: "Food delivery & Dining",
        botContent: " my food delivery & dining spend is ",
        order: 6,
        type: MESSAGE_TYPE.SLIDER,
        default: 5000,
        min: 0,
        max: 50000,
        step: 1000,
      },
      {
        m_id: "bill-payments",
        source: MESSAGE_SOURCE.ASSISTANT,
        content: "Bill Payment",
        botContent: " my bill payment spend is ",
        order: 6,
        type: MESSAGE_TYPE.SLIDER,
        default: 5000,
        min: 0,
        max: 50000,
        step: 1000,
      },
      {
        m_id: "online-shopping",
        source: MESSAGE_SOURCE.ASSISTANT,
        content:
          "Shopping on online platform ( fashion, groceries, daily needs etc.)",
        botContent:
          " my online shopping platform(fashion,groceries,daily needs) spend is ",
        order: 6,
        type: MESSAGE_TYPE.SLIDER,
        default: 50000,
        min: 0,
        max: 200000,
        step: 1000,
      },
    ],
  },
  {
    m_id: "fuel-and-taxes",
    source: MESSAGE_SOURCE.ASSISTANT,
    content: "",
    type: MESSAGE_TYPE.FORM,
    inputs: [
      {
        m_id: "fuel",
        source: MESSAGE_SOURCE.ASSISTANT,
        content: "Payment of fuel using a credit card",
        botContent: " my fuel spend is ",
        order: 6,
        type: MESSAGE_TYPE.SLIDER,
        default: 5000,
        min: 0,
        max: 50000,
        step: 1000,
      },
      {
        m_id: "taxes-insurance-rent",
        source: MESSAGE_SOURCE.ASSISTANT,
        content: "Payment of taxes, insurance, or rent using a credit card",
        botContent: " my spend on taxes, insurance or rent  is ",
        order: 6,
        type: MESSAGE_TYPE.SLIDER,
        default: 5000,
        min: 0,
        max: 50000,
        step: 1000,
      },
    ],
  },
];
