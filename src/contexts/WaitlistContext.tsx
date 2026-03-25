"use client";

import { trackEvent } from "@/lib/analytics/track";
import { EventName } from "@/lib/analytics/types";
import {
  createContext,
  useContext,
  useState,
  type PropsWithChildren,
} from "react";

interface WaitlistContextValue {
  showModal: boolean;
  openWaitlistModal: () => void;
  closeWaitlistModal: () => void;
}

const WaitlistContext = createContext<WaitlistContextValue | undefined>(undefined);

export const WaitlistProvider = ({ children }: PropsWithChildren) => {
  const [showModal, setShowModal] = useState<boolean>(false);

  const openWaitlistModal = () => {
    setShowModal(true)
  };
  const closeWaitlistModal = () => {
    trackEvent(EventName.BUTTON_CLICKED, {
      buttonName: EventName.CLOSE_WAITLIST_MODEL_BTN,
      location: EventName.LANDING_PAGE,
    });
    setShowModal(false);
  }

  return (
    <WaitlistContext.Provider
      value={{ showModal, openWaitlistModal, closeWaitlistModal }}
    >
      {children}
    </WaitlistContext.Provider>
  );
};

export const useWaitlistControl = (): WaitlistContextValue => {
  const context = useContext(WaitlistContext);

  if (!context) {
    throw new Error(
      "useWaitlistControl must be used within a WaitlistProvider"
    );
  }

  return context;
};
