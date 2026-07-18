import { BaseMessage, MESSAGE_SOURCE, MESSAGE_TYPE } from "@/types/chatMessages";
import { CHAT_ACTIONS } from "../actions";
import { chooseCardCategory } from "./common";

export const shoppingCard = [
  chooseCardCategory,
  {
    m_id: "average-shopping-spend",
    source: MESSAGE_SOURCE.ASSISTANT,
    content:
      "On an average how much do you spend on shopping (excluding Bill payments) in a month?",
    botContent: " my shopping spend in a month is ",
    order: 1,
    type: MESSAGE_TYPE.SELECT,
    slots: [
      {
        label: "Less than ₹20,000",
        value: 20000,
      },
      {
        label: "₹20,000 – ₹40,000",
        value: 40000,
      },
      {
        label: "₹40,000 – ₹75,000",
        value: 75000,
      },
      {
        label: "₹75,000 – ₹1.25 Lakhs",
        value: 125000,
      },
      {
        label: "More than ₹ 1.25 Lakhs",
        value: 300000,
      },
    ],
  },
  {
    m_id: "mostly-shopping",
    source: MESSAGE_SOURCE.ASSISTANT,
    content: "Where do you mostly shop (approx. figures are fine) ?",
    botContent: " shopping is ",
    order: 2,
    type: MESSAGE_TYPE.SELECT,
    slots: [
      {
        label: "Mostly online (>70% online)",
        value: "Mostly online (more than 70% online)",
      },
      {
        label: "Mix of online & offline (50-50)",
        value: "Mix of online and offline ( Approx. 50-50)",
      },
      {
        label: "Mostly offline (>70% offline)",
        value: "Mostly offline ( more than 70% offline)",
      },
    ],
  },
  {
    m_id: "preferred-shopping-online-platform",
    source: MESSAGE_SOURCE.ASSISTANT,
    content: "Preferred online platform ( select one or more)?",
    botContent: " preferred online platform is ",
    order: 3,
    type: MESSAGE_TYPE.MULTI_SELECT,
    submit:CHAT_ACTIONS.EVALUTE_RECOMMENDATION,
    slots: [
      {
        label: "Amazon",
        value: "Amazon",
        engineValue: "amazon",
      },
      {
        label: "Flipkart",
        value: "Flipkart",
        engineValue: "flipkart",
      },
      {
        label: "Myntra ",
        value: "Myntra ",
        engineValue: "myntra",
      },
      {
        label: "Ajio",
        value: "Ajio",
        engineValue: "ajio",
      },
      {
        label: "Nyka",
        value: "Nyka",
        engineValue: "nykaa",
      },
      {
        label: "Tata Neu/Tata CliQ",
        value: "Tata Neu/Tata CliQ",
        engineValue: "tata_neu_cliq",
      },
      {
        label: "I shop across many paltform",
        value: "I shop across many paltform",
        engineValue: "multiple_platform",
      }
    ],
  },
  {
    m_id: "utility-bill-payments-spend",
    source: MESSAGE_SOURCE.ASSISTANT,
    content: "Any additional spend on utility bill payments etc.?",
    order: 6,
    type: MESSAGE_TYPE.SELECT,
    slots: [
      {
        label: "Yes",
        value: "yes",
      },
      {
        label: "No",
        value: "no",
      },
    ],
  },
  {
    m_id: "payments-monthly-spend",
    source: MESSAGE_SOURCE.ASSISTANT,
    content: "What is the monthly spend on these payments?",
    botContent: " my additional spend on utility bill payments is ",
    conditionalRender:true,
    condition: (answers:BaseMessage[]) => {

      const requiredQuestion = answers?.find(item => item?.questionId === "utility-bill-payments-spend")

      return requiredQuestion?.content === "yes"
    },
    order: 7,
    type: MESSAGE_TYPE.SLIDER,
    default: 5000,
    min: 0,
    max: 100000,
    step: 500,
  },
  {
    m_id: "online-shopping-percentage",
    source: MESSAGE_SOURCE.ASSISTANT,
    content: "What percentage of your total shopping is online?",
    botContent: " total spending on online shopping is ",
    order: 5,
    type: MESSAGE_TYPE.SLIDER,
    dynamicFileds: ["default", "max"],
    default: (answers: BaseMessage[]) => {
      const requiredQuestion = answers?.find(
        (item: BaseMessage) => item?.questionId === "average-shopping-spend"
      );
      return Number(requiredQuestion?.content) * 0.6;
    },
    min: 0,
    max: (answers: BaseMessage[]) => {
      const requiredQuestion = answers?.find(
        (item: BaseMessage) => item?.questionId === "average-shopping-spend"
      );
      return Number(requiredQuestion?.content);
    },
    step: 500,
  },
];
