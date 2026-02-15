import FormInput from "@/components/FormInput/FormInput";
import MultiSelectInput from "@/components/MultiSelectInput/MultiSelectInput";
import SingleSelectInput from "@/components/SliderInput/SingleSelectInput/SingleSelectInput";
import SliderInput from "@/components/SliderInput/SliderInput";
import { BaseMessage, MESSAGE_TYPE } from "@/types/chatMessages";

interface RenderInputProps {
  message: Omit<BaseMessage, "source">;
  currentMessageId: string;
  isTyping: boolean;
  handleSend: (
    value: string | Record<string, string | number>,
    id?: string
  ) => void;
  enableInputs?: boolean;
  showSubmit?: boolean;
  selectedValue?:number|string
}

export const renderInput = ({
  message,
  currentMessageId,
  isTyping,
  handleSend,
  enableInputs,
  showSubmit,
  selectedValue
}: RenderInputProps) => {
  if (!message || !message.type) return null;
  switch (message.type) {
    case MESSAGE_TYPE.SLIDER:
      return (
        <SliderInput
          selectedValue={(message?.selectedValue ?? selectedValue) as number}
          showSubmit={showSubmit}
          disabled={
            enableInputs
              ? !enableInputs
              : message.m_id !== currentMessageId || isTyping
          }
          enableInputs={enableInputs}
          onSelectionSubmit
          value={message?.default}
          min={message?.min ?? 0}
          max={message?.max ?? 100000}
          sliderStep={message?.step}
          onSubmit={(selected) => handleSend(String(selected), message.m_id)}
        />
      );
    case MESSAGE_TYPE.SELECT:
      return (
        <SingleSelectInput
          selectedValue={(message?.selectedValue ?? selectedValue) as string}
          showSubmit={showSubmit}
          disabled={
            enableInputs
              ? !enableInputs
              : message.m_id !== currentMessageId || !!isTyping
          }
          onSelectionSubmit
          options={message?.slots ?? []}
          onSubmit={(selected) => handleSend(String(selected), message.m_id)}
        />
      );
    case MESSAGE_TYPE.BUTTON_GROUP:
      return (
        <SingleSelectInput
          isButtonGroup={true}
          selectedValue={(message?.selectedValue??selectedValue) as string}
          disabled={message.m_id !== currentMessageId || !!isTyping}
          onSelectionSubmit
          options={message?.slots ?? []}
          onSubmit={(selected) => handleSend(String(selected))}
        />
      );
    case MESSAGE_TYPE.MULTI_SELECT:
      return (
        <MultiSelectInput
          selectedValue={(message?.selectedValue??selectedValue) as string}
          maxSelect={message?.maxSelect}
          disabled={message.m_id !== currentMessageId || !!isTyping}
          options={message?.slots ?? []}
          onSubmit={(selected) => handleSend(String(selected))}
        />
      );
    case MESSAGE_TYPE.FORM:
      return (
        <FormInput
          selectedValue={message?.selectedValue as string}
          currentMessageId={currentMessageId}
          disabled={message.m_id !== currentMessageId || !!isTyping}
          inputs={message?.inputs ?? []}
          onSubmit={(selected) => handleSend(selected)}
        />
      );
    default:
      return null;
  }
};
