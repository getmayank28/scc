import { useState } from "react";
import Typography from "../Typography/Typography";
import { Checkbox } from "../ui/checkbox";
import { Button } from "../ui/button";
import toast from "react-hot-toast";

interface MultiSelectInputProps {
  options: { label: string; value: string }[];
  disabled: boolean;
  onSubmit: (selected: Array<string>) => void;
  maxSelect?:number
}

const MultiSelectInput = ({
  options,
  disabled,
  onSubmit,
  maxSelect
}: MultiSelectInputProps) => {
  const [selectedOptions, setSelectedOptions] = useState([]);
  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mt-3">
        {options?.map((ele) => (
          <div key={ele.value} className="flex gap-2 items-center">
            <Checkbox
              id="toggle-2"
              disabled={disabled}
              defaultChecked={Math.random() < 0.5}
              // @ts-expect-error some
              checked={selectedOptions?.includes(ele.value)}
              onClick={() => {

                 // @ts-expect-error some
                const isSelected = selectedOptions?.includes(ele.value);
                if (isSelected) {
                  const filteredOptions = selectedOptions?.filter(
                    (option) => option !== ele.value
                  );
                  setSelectedOptions(filteredOptions);
                } else {

                if(maxSelect && selectedOptions?.length >= maxSelect){
                  toast(`You can max select ${maxSelect} options`)
                  return 
                }
                   // @ts-expect-error some
                  setSelectedOptions((prev) => [...prev, ele.value]);
                }
              }}
              className="w-6 h-6 data-[state=checked]:border-secondary-orange border-secondary-orange data-[state=checked]:bg-secondary-orange data-[state=checked]:text-white"
            />
            <Typography variant="caption" className="text-left">
              {ele?.label}
            </Typography>
          </div>
        ))}
      </div>
     <div className="w-full flex justify-end">
     <Button
        onClick={() => onSubmit?.(selectedOptions)}
        disabled={!selectedOptions?.length || disabled}
        className="ml-auto mt-4 px-12 h-10 text-sm rounded-full hover:bg-primary-orange/70 bg-secondary-orange/70 cursor-pointer"
      >
        Submit
      </Button>
     </div>
    </div>
  );
};

export default MultiSelectInput;
