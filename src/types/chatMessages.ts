export type MessageSource = "user" | "assistant" | "system";

export const MESSAGE_SOURCE: Record<string, MessageSource> = {
  USER: "user",
  ASSISTANT: "assistant",
  SYSTEM: "system",
};
export const MESSAGE_TYPE: Record<string, MessageType> = {
  TEXT: "TextMessage",
  SESSION: "session",
  HISTORY: "HISTORY",
  SELECT: "SlotMessage",
  SLIDER: "SliderMessage",
  MULTI_SELECT: "MultiSelect",
  BUTTON_GROUP: "ButtonGroup",
  FORM: "form",
};

export type MessageType =
  | "TextMessage"
  | "session"
  | "SlotMessage"
  | "SliderMessage"
  | "HISTORY"
  | "MultiSelect"
  | "ButtonGroup"
  | "form";

interface Slots {
  label: string;
  value: string;
  variant?: string;
}

interface Slider {
  default_value: number;
  min_value: number;
  max_value: number;
}

export type DynamicValue<T> = T | ((answers: BaseMessage[]) => T);
export type DynamicFileds = "default" | "max";

export interface BaseMessage {
  m_id: string;
  content: string;
  botContent?: string;
  source: MessageSource;
  type: MessageType;
  ts?: string;
  search?: boolean;
  slots?: Slots[];
  slider?: Slider;
  order?: number;
  default?: number;
  min?: number;
  max?: number;
  step?: number;
  maxSelect?: number;
  conditionalRender?: boolean;
  condition?: (answers: BaseMessage[]) => void;
  inputs?: Omit<BaseMessage, "source">[];
  questionId?: string;
  questionType?: string;
  dynamicFileds?: DynamicFileds[];
  submit?: boolean | string;
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
