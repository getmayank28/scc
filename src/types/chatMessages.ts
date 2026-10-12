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
  | "form"
  | "FinalMessage";

interface Slots {
  label: string;
  value: string;
  variant?: string;
  // The typed value the local recommendation engine expects for this option
  // (a number for spend/count ranges, or a schema enum string). Declared on the
  // slot so the FE assembler reads it directly — no string parsing/normalization.
  // Falls back to `value` when omitted (e.g. options already carrying a number).
  engineValue?: string | number;
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
  ts?: string | undefined;
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
  custom_metadata?: Record<string, string>[];
  thread?: number;
  selectedValue?: string | number;
  // Raw per-field values for a FORM answer, keyed by the inner input's m_id.
  // Preserved so the recommendation-input assembler can read typed values that
  // the concatenated `content` string would otherwise lose.
  formValues?: Record<string, string | number>;
  // False for synthetic user messages that carry a `questionId` for transcript
  // rendering but are NOT the user's answer to it (e.g. the "Great, let's move
  // forward" continue acknowledgement). The recommendation-input assembler
  // skips these so they can't overwrite the real answer. Absent === true.
  isAnswer?: boolean;
}

export interface SessionMessage {
  type: "session";
  token: string;
  session_id: string;
}

export interface HistoryMessage {
  type: "history";
  messages: Array<BaseMessage>;
}

export type ChatMessage = BaseMessage;

export type ChatMessagesType = BaseMessage | SessionMessage | HistoryMessage;
