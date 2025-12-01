import React, { useState } from "react";
import { Button } from "@/components/ui/button";

interface SingleSelectProps {
  options: string[];
  disabled:boolean;
  onSubmit: (selected: string) => void;
}

export default function SingleSelectInput({
  disabled,
  options,
  onSubmit,
}: SingleSelectProps) {
  const [selectedPlatform, setSelectedPlatform] = useState("");

  const handleSubmit = () => {
    if (selectedPlatform) {
      onSubmit(selectedPlatform);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-0 mt-4">
      <div className="flex flex-wrap gap-4">
        {options.map((platform) => (
          <Button
            key={platform}
            onClick={() => setSelectedPlatform(platform)}
            variant={selectedPlatform === platform ? "default" : "outline"}
            className={`
              px-4 py-3 text-sm rounded-lg transition-all cursor-pointer
              ${
                selectedPlatform === platform
                  ? "bg-secondary-orange hover:bg-secondary-orange text-white"
                  : "bg-[#111] text-white/80 border-secondary-orange hover:text-white hover:bg-secondary-orange"
              }
            `}
            disabled={disabled}
          >
            {platform}
          </Button>
        ))}
      </div>

      <div className="mt-6 flex justify-between items-center">
        <div
          className={`p-4 pl-0 py-0 flex items-center transition-all duration-500`}
        >
          {selectedPlatform ? (
            <p className="text-white/70 text-sm">
              Selected platform:{" "}
              <span className="font-semibold text-primary-orange">
                {selectedPlatform}
              </span>
            </p>
          ) : (
            <p className="text-white/70 text-sm">Please select an option</p>
          )}
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!selectedPlatform|| disabled}
          className="px-12 h-10 text-sm rounded-full hover:bg-primary-orange/70 bg-secondary-orange/70 cursor-pointer"
        >
          Submit
        </Button>
      </div>
    </div>
  );
}
