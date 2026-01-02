import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { BadgeCheck } from "lucide-react";

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
    <div className="w-full max-w-4xl mx-auto p-0 mt-4">
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
              px-4 py-3 text-sm rounded-lg transition-all cursor-pointer
              ${
              // @ts-expect-error some
                platform.variant === 'primary'
                  ? "bg-secondary-orange hover:bg-secondary-orange text-white"
                  : "bg-[#111] text-white/80 border-secondary-orange hover:text-white hover:bg-secondary-orange"
              }
            `}
            disabled={disabled}
          >
            {platform?.label} {selectedPlatform ===platform.value && <BadgeCheck color="#F35A13"/>}
          </Button>
        ))}
      </div>

      <div className="mt-6 flex justify-between items-center">
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
