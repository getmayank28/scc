"use client";

import { DraggableCard } from "@/components/DraggableCard";
import { ActionButton } from "@/components/ui/action-button";

const GetCard = () => {
  return (
    <div className="border-0 min-h-screen bg-black border-white flex flex-col h-screen justify-center">
      <div className="max-md:px-5  max-md:gap-10 max-md:h-auto flex max-md:flex-col-reverse w-[80%] mx-auto relative">


        <div className="grow h-[60vh] max-md:h-auto flex flex-col max-md:items-start max-md:justify-center items-start justify-end">
          <h2 className="max-md:mb-0 text-white max-md:text-left text-center font-butlerpro text-[80px] max-md:text-[48px] font-medium leading-[120%] tracking-[-3.84px] font-kerning-none font-feature-settings-liga-off">
            Get the card <br className="max-md:hidden" />
            built for you
          </h2>
          <ActionButton title="Find my card" />
        </div>
        <div className="grow w-[60%] h-[80vh] overflow-hidden max-md:h-auto flex items-start justify-end">
          <DraggableCard />
        </div>
      </div>
    </div>
  );
};

export default GetCard;
