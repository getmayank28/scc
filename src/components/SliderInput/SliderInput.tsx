"use client"

import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"

interface SliderInputProps {
  min: number
  max: number
  onSubmit: (value: number) => void
  disabled:boolean
}

export default function SliderInput({ 
  min, 
  max, 
  onSubmit, 
  disabled
}: SliderInputProps) {
  const [selecteValue, setSelectedValue] = useState(10000);
  const handleSubmit = () => {
    if (selecteValue) {
      onSubmit(selecteValue);
    }
  };

  return (

    <div className="w-full max-w-4xl mx-auto p-0">
      <div className="space-y-6">
        {/* Min and Max Labels */}
        <div className="flex justify-between text-white text-sm">
          <span>Min: {min}</span>
          <span>Max: {max}</span>
        </div>

        {/* Slider */}
        <Slider
        disabled={disabled}
          value={[selecteValue]}
          onValueChange={(values) => setSelectedValue(values[0])}
          max={max}
          min={min}
          step={1}
          className="w-full"
        />

        {/* Input and Send Button */}
        <div className="flex items-center gap-4">
          <div className="relative w-full">
            <Input
             disabled={disabled}
              type="number"
              value={selecteValue}
              onChange={(e) => setSelectedValue(Number(e.target.value))}
              className="w-30 h-10 text-2xl text-center rounded-full border border-secondary-orange text-white"
              min={min}
              max={max}
            />
          </div>
          <Button 
            onClick={handleSubmit}
            disabled={!selecteValue ||  disabled}
            className="ml-auto px-12 h-10 text-sm rounded-full hover:bg-primary-orange/70 bg-secondary-orange/70 cursor-pointer"
          >
            Submit
          </Button>
        </div>
      </div>
    </div>
  )
}