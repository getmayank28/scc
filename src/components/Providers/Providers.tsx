"use client";
import { StateProviders } from "@/contexts/StateProvider";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { SidebarContainer } from "../SidebarConatainer/SidebarConatainer";
import SignInModal from "../SignInModal/SignInModal";
import { SignInProvider } from "@/contexts/SignInContext";
import { WaitlistProvider } from "@/contexts/WaitlistContext";
import { FeatureFlagProvider } from "@/contexts/FeatureContext";
import { featureFlags } from "@/lib/constants/featureFlags";

const ProvderContainer = ({ children }: { children: React.ReactNode }) => {

  return (
    <SessionProvider>
      <FeatureFlagProvider flags={featureFlags}>
      <SignInProvider>
        <WaitlistProvider>
        <Toaster position="top-right" />
        <StateProviders>
          <SignInModal />
          <SidebarContainer>{children}</SidebarContainer>
        </StateProviders>
        </WaitlistProvider>
      </SignInProvider>
      </FeatureFlagProvider>
    </SessionProvider>
  );
};

export default ProvderContainer;
