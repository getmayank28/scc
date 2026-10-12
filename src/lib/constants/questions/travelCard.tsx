import {
  BaseMessage,
  MESSAGE_SOURCE,
  MESSAGE_TYPE,
} from "@/types/chatMessages";
import { CHAT_ACTIONS } from "../actions";
import { chooseCardCategory } from "./common";



export const travelCard: BaseMessage[] = [
  chooseCardCategory,
  {
    m_id: "domestic-international-holidays-trips",
    source: MESSAGE_SOURCE.ASSISTANT,
    content:
      "About how many holidays trips (domestic + international) do you take in a year?",
    botContent: "total trips I take in a year is ",
    order: 1,
    type: MESSAGE_TYPE.SELECT,
    slots: [
      {
        label: "1-2",
        value: "1-2",
        engineValue: 2,
      },
      {
        label: "2-3",
        value: "2-3",
        engineValue: 3,
      },
      {
        label: "4-5",
        value: "4-5",
        engineValue: 5,
      },
      {
        label: "6+",
        value: "6+",
        engineValue: 7,
      },
    ],
  },
  {
    m_id: "total-travel-spend",
    source: MESSAGE_SOURCE.ASSISTANT,
    content: "Roughly how much of your total travel spend is international?",
    botContent: " my total travel international spend is ",
    order: 2,
    type: MESSAGE_TYPE.SELECT,
    slots: [
      {
        label: "Only domestic",
        value: "Only domestic",
        engineValue: "only_domestic",
      },
      {
        label: "Mostly domestic",
        value: "Mostly domestic",
        engineValue: "mostly_domestic",
      },
      {
        label: "Mostly international",
        value: "Mostly international",
        engineValue: "mostly_international",
      },
      {
        label: "Roughly equal",
        value: "Roughly equal",
        engineValue: "balanced",
      },
    ],
  },
  {
    m_id: "spend-per-holiday",
    source: MESSAGE_SOURCE.ASSISTANT,
    content: "On average, how much do you spend per holiday?",
    botContent: " my per holiday spend is ",
    order: 3,
    type: MESSAGE_TYPE.SELECT,
    submit: CHAT_ACTIONS.EVALUTE_RECOMMENDATION,
    slots: [
      {
        label: "Less than ₹50,000",
        value: "Less than ₹50,000",
        engineValue: 40000,
      },
      {
        label: "₹50,000 – ₹1,00,000",
        value: "₹50,000 – ₹1,00,000",
        engineValue: 75000,
      },
      {
        label: "₹1 – ₹1.5 lakhs",
        value: "₹1 – ₹1.5 lakhs",
        engineValue: 125000,
      },
      {
        label: "₹1.5 – ₹2 lakhs",
        value: "₹1.5 – ₹2 lakhs",
        engineValue: 175000,
      },
      {
        label: "₹2 lakhs+",
        value: "₹2 lakhs+",
        engineValue: 250000,
      },
    ],
  },
  {
    m_id: "travel-priority",
    source: MESSAGE_SOURCE.ASSISTANT,
    content: "What matters most to you in a travel credit card?",
    botContent: " my travel priority is ",
    order: 8,
    type: MESSAGE_TYPE.MULTI_SELECT,
    slots: [
      {
        label: "Free flights(miles & airline transfers)",
        value: "Free flights(miles & airline transfers)",
        engineValue: "maximumRewards",
      },
      {
        label: "Airport lounge access",
        value: "Airport lounge access",
        engineValue: "loungeAccess",
      },
      {
        label: "Luxury travel perks(upgrades, concierge, golf, elite status)",
        value: "Luxury travel perks(upgrades, concierge, golf, elite status)",
        engineValue: "maximumRewards",
      },
      {
        label: "Low forex markup",
        value: "Low forex markup",
        engineValue: "lowForex",
      },
      {
        label: "Maximum rewards",
        value: "Maximum rewards",
        engineValue: "maximumRewards",
      },
    ],
  },
  {
    m_id: "international-holiday-trip",
    source: MESSAGE_SOURCE.ASSISTANT,
    content: "Out of the total trips you mentioned, how many are international?",
    botContent: " international holiday trip I take in a year is ",
    order: 5,
    type: MESSAGE_TYPE.SLIDER,
    default: 3,
    min: 0,
    max: 10,
    step: 1,
    conditionalRender: true,
    condition: (answers: BaseMessage[]) => {
      const travelSpendCategory =
        answers?.find(
          (item) => item.questionId === "total-travel-spend"
        )?.content || "";
      const isOnlyDomestic = ["Only domestic"]?.includes(travelSpendCategory)
      return !isOnlyDomestic
    },
  },
  {
    m_id: "per-international-trip-spend",
    source: MESSAGE_SOURCE.ASSISTANT,
    content: "Approx how much do you spend on each international trip?",
    botContent: " my spend on each international trip is ",
    order: 6,
    type: MESSAGE_TYPE.SELECT,
    conditionalRender: true,
    condition: (answers: BaseMessage[]) => {
      const travelSpendCategory =
        answers?.find(
          (item) => item.questionId === "total-travel-spend"
        )?.content || "";
      const isOnlyDomestic = ["Only domestic"]?.includes(travelSpendCategory)
      return !isOnlyDomestic
    },
    slots: [
      {
        label: "Less than ₹1 lakh",
        value: "Less than ₹1 lakh",
        engineValue: 75000,
      },
      {
        label: "₹1 – ₹1.5 lakhs",
        value: "₹1 – ₹1.5 lakhs",
        engineValue: 125000,
      },
      {
        label: "₹1.5 – ₹2 lakhs",
        value: "₹1.5 – ₹2 lakhs",
        engineValue: 175000,
      },
      {
        label: "₹3 lakhs+",
        value: "₹3 lakhs+",
        engineValue: 300000,
      },
    ],
  },
  {
    m_id: "additional-flights",
    source: MESSAGE_SOURCE.ASSISTANT,
    content: "Additional flight spend (excluding holidays)",
    botContent: " my additional flight spend excluding holidays is ",
    order: 7,
    type: MESSAGE_TYPE.SELECT,
    slots: [
      {
        label: "None",
        value: "none",
        engineValue: 0,
      },
      {
        label: "Up to ~₹50,000",
        value: "Up to ~₹50,000",
        engineValue: 40000,
      },
      {
        label: "₹50,000 - ₹1 lakh",
        value: "₹50,000 - ₹1 lakh",
        engineValue: 75000,
      },
      {
        label: "₹1 lakhs - ₹2 Lakhs",
        value: "₹1 lakhs - ₹2 Lakhs",
        engineValue: 150000,
      },
      {
        label: "₹2 lakhs+",
        value: "₹2 lakhs+",
        engineValue: 250000,
      },
    ],
  },

];
