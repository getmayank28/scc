import { renderInput } from "@/lib/utils/renderInput";
import {  BaseMessage } from "@/types/chatMessages";
import { useMemo, useState } from "react";
import { Button } from "../ui/button";

interface FormInputProps {
inputs: Omit<BaseMessage, "source">[] | never[];
  disabled: boolean;
  onSubmit: (selected: Record<string, string | number>) => void;
  currentMessageId: string;
  selectedValue?:string
}


function extractSlotValues(
  options: Omit<BaseMessage, "source">[] | never[],
  finalString: string
): Record<string, string> {
  const result: Record<string, string> = {};

  for (let i = 0; i < options.length; i++) {
    const current = options[i];
    const next = options[i + 1];

    const startIndex =
      finalString.indexOf(current.botContent??"") +
      (current.botContent??"").length;

    if (startIndex === -1) continue;

    const endIndex = next
      ? finalString.indexOf(next.botContent??"")
      : finalString.length;

    const extractedValue = finalString
      .substring(startIndex, endIndex)
      .trim();

    result[current.m_id] = extractedValue;
  }

  return result;
}
const FormInput = ({
  disabled,
  onSubmit,
  inputs,
  currentMessageId,
  selectedValue
}: FormInputProps) => {
  const getSelectedValues = useMemo(()=>{
    if(selectedValue){
      return extractSlotValues(inputs,selectedValue)
    }
    return null
  },[])
  const [formState, setFormState] = useState(() =>
     Object.fromEntries(
      inputs?.map((input) => [input?.m_id,  input?.default||""])
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
                showSubmit:false,
                message: input,
                selectedValue:getSelectedValues?.[input?.m_id],
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
        className="px-8 h-10 bg-primary-orange ml-auto -mt-11 max-md:mt-4 max-md:w-full"
        onClick={handleSubmit}
      >
        Submit
      </Button>
    </div>
  );
};

export default FormInput;
