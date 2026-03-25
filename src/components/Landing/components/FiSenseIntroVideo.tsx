import { useRef, useState } from "react";
import Typography from "@/components/Typography/Typography";
import { Play } from "lucide-react";
import { trackEvent } from "@/lib/analytics/track";
import { EventName } from "@/lib/analytics/types";

const FiSenseIntroVideo = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = () => {
    if (videoRef.current) {
      trackEvent(EventName.BUTTON_CLICKED, {
        buttonName: EventName.SEE_IT_IN_ACTION_SECTION_BTN,
        location: EventName.LANDING_PAGE,
      });
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen max-md:min-h-fit max-md:py-20 bg-background-primary p-6 shadow-2xl">
      
      <div className="max-w-[984px] w-full text-center">
        <Typography className="text-center font-butlerpro font-medium leading-24 mb-6">
          See it in action
        </Typography>

        <div className="relative w-full max-w-4xl mx-auto rounded-xl overflow-hidden cursor-pointer">
          
          {/* Thumbnail */}
          {!isPlaying && (
            <div
              className="absolute inset-0 z-10 flex items-center justify-center bg-black/30"
              onClick={handlePlay}
            >
              <img
                src="/images/video-thumbnail.png"
                alt="Video thumbnail"
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* Play button */}
              <div className="relative z-20 w-16 h-16 bg-primary-orange rounded-full flex items-center justify-center">
              <Play color="#fff"/>
              </div>
            </div>
          )}

          {/* Video */}
          <video
            ref={videoRef}
            className="w-full"
            controls={isPlaying}
          >
            <source src="/video/fisense-intro-video.mp4" type="video/mp4" />
          </video>

        </div>
      </div>

    </div>
  );
};

export default FiSenseIntroVideo;