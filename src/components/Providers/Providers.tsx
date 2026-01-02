"use client";
import { StateProviders } from "@/contexts/StateProvider";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { SidebarContainer } from "../SidebarConatainer/SidebarConatainer";
import SignInModal from "../SignInModal/SignInModal";
import useSignInControl from "@/lib/hooks/useSignInControl";

const ProvderContainer = ({ children }: { children: React.ReactNode }) => {
  const { showModal } = useSignInControl();

  return (
    <SessionProvider>
      <Toaster position="top-right" />
      <StateProviders>
        <SignInModal open={showModal} />
        <SidebarContainer>{children}</SidebarContainer>
      </StateProviders>
    </SessionProvider>
  );
};

export default ProvderContainer;
