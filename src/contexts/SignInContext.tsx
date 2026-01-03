"use client";

import {
  createContext,
  useContext,
  useState,
  type PropsWithChildren,
} from "react";

interface SignInContextValue {
  showModal: boolean;
  openSignUpModal: () => void;
  closeSignUpModal: () => void;
}

const SignInContext = createContext<SignInContextValue | undefined>(undefined);

export const SignInProvider = ({ children }: PropsWithChildren) => {
  const [showModal, setShowModal] = useState<boolean>(false);

  const openSignUpModal = () => setShowModal(true);
  const closeSignUpModal = () => setShowModal(false);

  return (
    <SignInContext.Provider
      value={{ showModal, openSignUpModal, closeSignUpModal }}
    >
      {children}
    </SignInContext.Provider>
  );
};

export const useSignInControl = (): SignInContextValue => {
  const context = useContext(SignInContext);

  if (!context) {
    throw new Error(
      "useSignInControl must be used within a SignInProvider"
    );
  }

  return context;
};
