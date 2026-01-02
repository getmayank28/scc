import { CardsType } from "@/types/card";
import { BaseMessage, MESSAGE_TYPE } from "@/types/chatMessages";
import { CARD_CATEGORY } from "../data/cards";

export const createBotRecommendationContent = (
  messages: BaseMessage[],
  cardType: CardsType
) => {
  let contentMsg = "";
  messages?.forEach((msg: BaseMessage, ind: number) => {
    if (msg?.botContent || msg?.questionType === MESSAGE_TYPE.FORM) {
      contentMsg =
        contentMsg +
        (msg?.botContent || "") +
        msg?.content +
        (messages.length - 1 === ind ? "" : " and");
    }
  });

  const startingMessage = {
    [CARD_CATEGORY.TRAVEL]: "I want a travel card, ",
    [CARD_CATEGORY.FOOD]: "I want a food and dining card, ",
    [CARD_CATEGORY.SHOPPING]: "I want a shopping card, ",
    [CARD_CATEGORY.ALL_ROUNDER]: "I want a all rounder card, ",
  };

  const message = startingMessage[cardType] + contentMsg;
  return {
    source: "user",
    content: message,
    m_id: crypto.randomUUID(),
    ts: new Date().toISOString(),
    type: "TextMessage",
  };
};

export const getMessageContent = ({
  messageType,
  inputValue,
  questions,
}: {
  messageType: string;
  inputValue: string | Record<string, string | number>;
  questions: BaseMessage[] | Omit<BaseMessage, "source">[] | undefined;
}) => {
  if (!messageType || !inputValue) return;

  let contentMsg = "";

  if (messageType === MESSAGE_TYPE.FORM) {
    const formValue = inputValue as Record<string, string | number>;

    questions?.forEach((msg: BaseMessage | Omit<BaseMessage, "source">) => {
      contentMsg = contentMsg + msg?.botContent + formValue?.[msg?.m_id];
    });
  } else {
    contentMsg = inputValue as string;
  }

  return contentMsg;
};
