import { renderInput } from "@/lib/utils/renderInput";
import {  BaseMessage } from "@/types/chatMessages";
import { useState } from "react";
import { Button } from "../ui/button";

interface FormInputProps {
inputs: Omit<BaseMessage, "source">[] | never[];
  disabled: boolean;
  onSubmit: (selected: Record<string, string | number>) => void;
  currentMessageId: string;
}
const FormInput = ({
  disabled,
  onSubmit,
  inputs,
  currentMessageId,
}: FormInputProps) => {
  const [formState, setFormState] = useState(() =>
    Object.fromEntries(
      inputs?.map(({ m_id }) => [m_id,  ""])
    )
  );

  const handleSubmit = () => {
    onSubmit?.(formState);
  };

  const disableButton = Object.values(formState)?.some((ele) => !ele);
  
  return (
    <div className="flex flex-col items-end p-1">
      <div className="flex flex-col gap-2">
        {inputs?.map((input) => (
          <div key={input?.m_id}>
            <p>{input.content}</p>
            <div>
              {renderInput({
                message: input,
                currentMessageId: currentMessageId,
                isTyping: false,
                enableInputs: !disabled,
                handleSend: (value, id) => {
                  setFormState((prev) => ({
                    ...prev,
                    [id as string]: value as string,
                  }));
                },
              })}
            </div>
          </div>
        ))}
      </div>
      <Button
        disabled={disabled || disableButton}
        className="px-8 h-10 bg-primary-orange/70 ml-auto -mt-11"
        onClick={handleSubmit}
      >
        Submit
      </Button>
    </div>
  );
};

export default FormInput;
