"use client";
import { StateProviders } from "@/contexts/StateProvider";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { SidebarContainer } from "../SidebarConatainer/SidebarConatainer";
import SignInModal from "../SignInModal/SignInModal";
import { SignInProvider } from "@/contexts/SignInContext";

const ProvderContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <SessionProvider>
      <SignInProvider>
        <Toaster position="top-right" />
        <StateProviders>
          <SignInModal />
          <SidebarContainer>{children}</SidebarContainer>
        </StateProviders>
      </SignInProvider>
    </SessionProvider>
  );
};

export default ProvderContainer;
