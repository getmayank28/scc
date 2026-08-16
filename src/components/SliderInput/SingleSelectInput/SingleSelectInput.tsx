import React, { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface SingleSelectProps {
  options: { label: string; value: string }[];
  disabled: boolean;
  onSubmit: (selected: string) => void;
  onSelectionSubmit?: boolean;
  showSubmit?: boolean;
  selectedValue?: string;
  isButtonGroup?: boolean
}

export default function SingleSelectInput({
  disabled,
  options,
  onSubmit,
  onSelectionSubmit = false,
  showSubmit = true,
  selectedValue,
  isButtonGroup = false
}: SingleSelectProps) {

  const buttonGroupSelectedValue = useMemo(() => {

    if (selectedValue) {
      if (isButtonGroup) {
        return options?.find(ele => ele?.label?.toLowerCase()?.includes(selectedValue?.toLowerCase()))?.value
      } else {
        return selectedValue
      }
    }

    return null
  }, [selectedValue, isButtonGroup])


  const [selectedPlatform, setSelectedPlatform] = useState(buttonGroupSelectedValue ?? "");

  /**
   * One answer per question, latched on the first click.
   *
   * The parent disables these buttons by moving `currentMessageId` off this
   * message, but that is React state: it does not land until the next render,
   * so the buttons stay live for the rest of the current click's tick. An
   * action like "No, I am good" — which opens the socket for follow-up and,
   * unlike the recommendation path, never turns the typing loader on — has no
   * other guard covering it, so repeat taps during the connect window each
   * fire a fresh turn. A ref flips synchronously and closes that window.
   */
  const hasSubmitted = useRef(false);

  const submitOnce = (value: string) => {
    if (!value || hasSubmitted.current) return;
    hasSubmitted.current = true;
    setHasSubmittedState(true);
    onSubmit?.(value);
  };

  // Mirrors the ref so a latched group also re-renders into its disabled state;
  // the ref is what actually blocks the second click.
  const [hasSubmittedState, setHasSubmittedState] = useState(false);

  const handleSubmit = () => {
    submitOnce(selectedPlatform);
  };

  const handleSubmitByOptionClick = (value: string) => {
    submitOnce(value);
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-0 mt-4 max-md:h-auto max-md:mt-2">
      <div className="flex flex-wrap gap-4 max-md:gap-2">
        {options.map((platform) => (
          <Button
            key={platform?.value}
            onClick={() => {
              if (hasSubmitted.current) return;
              setSelectedPlatform(platform?.value);
              handleSubmitByOptionClick(platform?.value);
            }}

            variant={
              // @ts-expect-error some
              platform.variant || 'outline'
            }
            className={`
              px-4 py-3 max-md:py-1 max-md:px-3 max-md:text-xs text-sm rounded-lg transition-all cursor-pointer
              ${
              // @ts-expect-error some
              platform.variant === 'primary'
                ? "bg-primary-orange hover:bg-primary-orange/70 text-white font-semibold"
                : `bg-brown-sidebar text-white font-semibold ${selectedPlatform === platform.value ? "text-primary-orange border-primary-orange" : "border-primary-orange"}  hover:text-white hover:border-primary-orange`
              }
            `}
            disabled={disabled || hasSubmittedState}
          >
            {platform?.label}
          </Button>
        ))}
      </div>

      <div className="mt-6 max-md:mt-0 flex justify-between items-center">
        <div
          className={`p-4 pl-0 py-0 flex items-center transition-all duration-500`}
        >
          {!onSelectionSubmit && (
            selectedPlatform ? (
              <p className="text-white/70 text-sm">
                Selected platform:{" "}
                <span className="font-semibold text-primary-orange">
                  {selectedPlatform}
                </span>
              </p>
            ) : (
              <p className="text-white/70 text-sm">Please select an option</p>
            )
          )}
        </div>
        {
          !onSelectionSubmit && showSubmit && (
            <Button
              onClick={handleSubmit}
              disabled={!selectedPlatform || disabled || hasSubmittedState}
              className="px-12 h-10 text-sm rounded-full hover:bg-primary-orange/70 bg-secondary-orange/70 cursor-pointer"
            >
              Submit
            </Button>
          )
        }

      </div>
    </div>
  );
}
