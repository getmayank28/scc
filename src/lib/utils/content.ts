import { CardsType } from "@/types/card";
import {
  BaseMessage,
  MESSAGE_SOURCE,
  MESSAGE_TYPE,
} from "@/types/chatMessages";
import { CARD_CATEGORY } from "../data/cards";
import { HistoryActions } from "@/types/actions";
import { HISTORY_ACTIONS } from "../constants/actions";

const startingMessage = {
  [CARD_CATEGORY.TRAVEL]: "I want a travel card, ",
  [CARD_CATEGORY.FOOD]: "I want a food and dining card, ",
  [CARD_CATEGORY.SHOPPING]: "I want a shopping card, ",
  [CARD_CATEGORY.ALL_ROUNDER]: "I want a all rounder card, ",
};

export const filterUserMessage = (messages: BaseMessage[]) => {
  const userMessage = messages?.filter(
    (msg) => msg.source === MESSAGE_SOURCE.USER,
  );
  return userMessage;
};
export const createBotRecommendationContent = (
  messages: BaseMessage[],
  cardType: CardsType,
  action?: HistoryActions,
) => {
  let data = messages;
  if (action === HISTORY_ACTIONS.END_RECOMMENDATION) {
    const startingPoint = messages?.findIndex(
      (message: BaseMessage) => message?.thread && message?.thread === 2,
    );

    data = messages?.slice(startingPoint + 1);
  }

  let contentMsg = "";
  data?.forEach((msg: BaseMessage, ind: number) => {
    if (msg?.botContent || msg?.questionType === MESSAGE_TYPE.FORM) {
      contentMsg =
        contentMsg +
        (msg?.botContent || "") +
        msg?.content +
        (messages.length - 1 === ind ? "" : " and");
    }
  });

  const rawMetaData = data?.map((message: BaseMessage) => ({
    [message?.questionId as string]: message?.content,
  }));

  const metaDeta = [...rawMetaData, { action }];

  let finalMessage = "";
  if (action === HISTORY_ACTIONS.END_RECOMMENDATION) {
    finalMessage = contentMsg;
  } else {
    finalMessage = startingMessage[cardType] + contentMsg;
    metaDeta?.unshift({ "card-category-fs": cardType });
  }

  return {
    source: "user",
    content:
      finalMessage +
      ", note: assumed required value from spend_estimation_model.docx",
    m_id: crypto.randomUUID(),
    ts: new Date().toISOString(),
    type: "TextMessage",
    custom_metadata: metaDeta,
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

type Message = {
  content: string;
  m_id: string;
  ts: string;
};

type JoinedMessage = Message & {
  content: string;
};

export function joinTextMessagesByMid(messages: Message[]): JoinedMessage[] {
  const grouped = new Map<string, Message[]>();

  // Group by m_id
  for (const msg of messages) {
    if (!grouped.has(msg.m_id)) {
      grouped.set(msg.m_id, []);
    }
    grouped.get(msg.m_id)!.push(msg);
  }

  // Sort by ts and join content
  const result: JoinedMessage[] = [];

  for (const [, group] of grouped) {
    const sorted = group.sort(
      (a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime(),
    );

    const joinedContent = sorted.map((m) => m.content).join("");

    // Use the first message as base metadata
    result.push({
      ...sorted[0],
      content: joinedContent,
    });
  }

  return result;
}
