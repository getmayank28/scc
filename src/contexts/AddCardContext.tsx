"use client";

import { createContext, useCallback, useContext, useState, type PropsWithChildren } from "react";

/** Where the modal was opened from, for analytics. Add new surfaces here. */
export type AddCardSource =
  | "home_hero"
  | "home_wallet"
  | "home_my_cards"
  | "spend_optimizer"
  | "profile"
  | "other";

interface AddCardContextValue {
  isOpen: boolean;
  source: AddCardSource;
  /** Open the add-card modal from anywhere: `openAddCard("profile")`. */
  openAddCard: (source?: AddCardSource) => void;
  closeAddCard: () => void;
}

const AddCardContext = createContext<AddCardContextValue | undefined>(undefined);

export const AddCardProvider = ({ children }: PropsWithChildren) => {
  const [isOpen, setIsOpen] = useState(false);
  const [source, setSource] = useState<AddCardSource>("other");

  const openAddCard = useCallback((from: AddCardSource = "other") => {
    setSource(from);
    setIsOpen(true);
  }, []);
  const closeAddCard = useCallback(() => setIsOpen(false), []);

  return (
    <AddCardContext.Provider value={{ isOpen, source, openAddCard, closeAddCard }}>
      {children}
    </AddCardContext.Provider>
  );
};

export const useAddCardModal = (): AddCardContextValue => {
  const context = useContext(AddCardContext);
  if (!context) throw new Error("useAddCardModal must be used within an AddCardProvider");
  return context;
};
