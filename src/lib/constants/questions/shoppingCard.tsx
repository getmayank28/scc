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
        label: "Less than ₹25,000",
        value: "Less than ₹25,000",
      },
      {
        label: "₹25,000 – ₹50,000",
        value: "₹25,000 – ₹50,000",
      },
      {
        label: "₹50,000 – ₹75,000",
        value: "₹50,000 – ₹75,000",
      },
      {
        label: "₹75,000 – ₹ 1 Lakhs",
        value: "₹75,000 – ₹ 1 Lakhs",
      },
      {
        label: "More than ₹ 1 Lakhs",
        value: "More than ₹ 1 Lakhs",
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
        label: "Mostly online (more than 70% online)",
        value: "Mostly online (more than 70% online)",
      },
      {
        label: "Mix of online and offline ( Approx. 50-50)",
        value: "Mix of online and offline ( Approx. 50-50)",
      },
      {
        label: "Mostly offline ( more than 70% offline)",
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
      },
      {
        label: "Flipkart",
        value: "Flipkart",
      },
      {
        label: "Myntra ",
        value: "Myntra ",
      },
      {
        label: "Ajio",
        value: "Ajio",
      },
      {
        label: "Nyka",
        value: "Nyka",
      },
    ],
  },
  {
    m_id: "online-shopping-percentage",
    source: MESSAGE_SOURCE.ASSISTANT,
    content: "What percentage of your total shopping is online?",
    botContent: " total spending on online shopping is ",
    order: 5,
    type: MESSAGE_TYPE.SLIDER,
    default: 10000,
    min: 0,
    max: 100000,
    step: 100,
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
    default: 10000,
    min: 0,
    max: 100000,
    step: 100,
  },
];
