"use client";

import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {  useMemo, useState } from "react";

interface SliderInputProps {
  min: number;
  max: number;
  onSubmit?: (value: number) => void;
  disabled?: boolean;
  showMinMax: boolean;
  title?: string;
  description?: string;
  isOutsideControl?:boolean, 
  value?:number;
  onChange?:(value:number)=> void
}

export default function SliderInput({
  min,
  max,
  onSubmit,
  disabled,
  showMinMax,
  title,
  description,
  isOutsideControl, 
  onChange, 
  value
}: SliderInputProps) {
  const [selecteValue, setSelectedValue] = useState(10000);


  const inputValue = useMemo(()=> {
    if(isOutsideControl) return value
    return selecteValue
  },[isOutsideControl,selecteValue, value])


  const handleChange = (value:number) => {
    if(isOutsideControl){
      onChange?.(value)
    }else{
      setSelectedValue(value)
    }
 
  }
  const handleSubmit = () => {
    if (inputValue) {
      onSubmit?.(inputValue);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-0">
      <div className="space-y-6">
        {/* Min and Max Labels */}

        {showMinMax && (
          <div className="flex justify-between text-white text-sm">
            <span>Min: {min}</span>
            <span>Max: {max}</span>
          </div>
        )}

        <div className="flex justify-between">
          <div className="w-full">
            {title && (
              <p className="text-white w-full opacity-90 relative z-[100] text-left font-satoshi text-[14px] font-normal leading-[150%] tracking-[-2%] [font-feature-settings:'ss03_on']">
                {title}
              </p>
            )}
            {description && (
              <p className="text-white opacity-70 mb-2 relative z-[100] text-left font-satoshi text-[12px] font-normal leading-[150%] tracking-[-2%] [font-feature-settings:'ss03_on']">
                {description}
              </p>
            )}
          </div>
          <div>
            <Input
              disabled={disabled}
              type="number"
              value={inputValue}
              onChange={(e) => handleChange(Number(e.target.value))}
              className="w-30 h-10 text-2xl text-center rounded-full border border-secondary-orange text-white"
              min={min}
              max={max}
            />
          </div>
        </div>

        {/* Slider */}
        <Slider
          disabled={disabled}
          value={[inputValue||0]}
          onValueChange={(values) => handleChange(values[0])}
          max={max}
          min={min}
          step={1}
          className="w-full"
        />

        {/* Input and Send Button */}
        {onSubmit && (
          <div className="flex items-center gap-4">
            <div className="relative w-full">
              <Input
                disabled={disabled}
                type="number"
                value={inputValue}
                onChange={(e) => handleChange(Number(e.target.value))}
                className="w-30 h-10 text-2xl text-center rounded-full border border-secondary-orange text-white"
                min={min}
                max={max}
              />
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!inputValue || disabled}
              className="ml-auto px-12 h-10 text-sm rounded-full hover:bg-primary-orange/70 bg-secondary-orange/70 cursor-pointer"
            >
              Submit
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
