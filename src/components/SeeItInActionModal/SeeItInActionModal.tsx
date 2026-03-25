"use client";

import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "../ui/stateful-button";
import { Play } from "lucide-react";
import { trackEvent } from "@/lib/analytics/track";
import { EventName } from "@/lib/analytics/types";

const SeeItInActionModal = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [open, setOpen] = useState(false);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);

    if (!isOpen && videoRef.current) {
      // Pause & reset when modal closes
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const handlePlay = () => {
    trackEvent(EventName.BUTTON_CLICKED, {
        buttonName: EventName.SEE_IT_IN_ACTION_BTN,
        location: EventName.LANDING_PAGE,
      });
    setTimeout(() => {
      videoRef.current?.play();
    }, 100); // slight delay ensures modal is mounted
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          className="rounded-full flex gap-2 cursor-pointer justify-center items-center border-2 border-[#6F4D34] text-white/80 text-sm max-md:mt-6 font-bold py-3 px-4 my-10 mx-auto"
          style={{
            background:
              "linear-gradient(135deg,#30251E 50%,#6F4D34 100%,#AD744A 100%)",
          }}
          onClick={handlePlay}
        >
            <Play size={20} />
          See it in Action
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-none w-[60vw] p-0 overflow-hidden border-black">
        <video ref={videoRef} className="w-full h-auto" controls playsInline>
          <source src="/video/fisense-intro-video.mp4" type="video/mp4" />
        </video>
      </DialogContent>
    </Dialog>
  );
};

export default SeeItInActionModal;
