import React, { useState } from "react";
import { Button } from "@/components/ui/button";

interface SingleSelectProps {
  options: { label: string; value: string }[];
  disabled: boolean;
  onSubmit: (selected: string) => void;
  onSelectionSubmit?:boolean
}

export default function SingleSelectInput({
  disabled,
  options,
  onSubmit,
  onSelectionSubmit=false,
}: SingleSelectProps) {
  const [selectedPlatform, setSelectedPlatform] = useState("");

  const handleSubmit = () => {
    if (selectedPlatform) {
      onSubmit(selectedPlatform);
    }
  };

  const handleSubmitByOptionClick = (value:string) => {
    if(value) onSubmit?.(value);
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-0 mt-4 max-md:h-auto max-md:mt-2">
      <div className="flex flex-wrap gap-4">
        {options.map((platform) => (
          <Button
            key={platform?.value}
            onClick={() => {
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
                  ? "bg-secondary-orange hover:bg-primary-orange text-white"
                  : `bg-[#111] text-white/80 ${selectedPlatform ===platform.value?"text-primary-orange border-primary-orange":"border-secondary-orange"}  hover:text-white hover:border-primary-orange`
              }
            `}
            disabled={disabled}
          >
            {platform?.label}
          </Button>
        ))}
      </div>

      <div className="mt-6 max-md:mt-0 flex justify-between items-center">
        <div
          className={`p-4 pl-0 py-0 flex items-center transition-all duration-500`}
        >
          {!onSelectionSubmit &&(
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
          !onSelectionSubmit &&(
            <Button
          onClick={handleSubmit}
          disabled={!selectedPlatform || disabled}
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
