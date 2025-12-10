export type MessageSource = "user" | "assistant" | "system";

export const MESSAGE_TYPE = {
  TXET: "TextMessage",
  SESSION: "session",
  HISTORY: "HISTORY",
  SELECT: "SlotMessage",
  SLIDER: "SliderMessage",
};

export type MessageType =
  | "TextMessage"
  | "session"
  | "SlotMessage"
  | "SliderMessage";

interface Slots {
  label: string;
  value: string;
}

interface Slider {
  default_value: number;
  min_value: number;
  max_value: number;
}

export interface BaseMessage {
  m_id: string;
  content: string;
  source: MessageSource;
  type: MessageType;
  ts?: string;
  search?: boolean;
  slots?: Slots[];
  slider?: Slider;
}

export interface SessionMessage {
  type: "session";
  token: string;
}

export interface HistoryMessage {
  type: "history";
  messages: Array<BaseMessage>;
}

export type ChatMessage = BaseMessage;

export type ChatMessagesType = BaseMessage | SessionMessage | HistoryMessage;
