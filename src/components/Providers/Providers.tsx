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
import { ChatContextProvider } from "@/contexts/ChatContext";
import { WebSocketConnectionProvider } from "@/contexts/WebSocketConnection";

const ProvderContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <SessionProvider>
      <FeatureFlagProvider flags={featureFlags}>
        <SignInProvider>
          <ChatContextProvider>
            <WaitlistProvider>
              <Toaster position="top-right" />
              <StateProviders>
                <WebSocketConnectionProvider>
                  <SignInModal />
                  <SidebarContainer>{children}</SidebarContainer>
                </WebSocketConnectionProvider>
              </StateProviders>
            </WaitlistProvider>
          </ChatContextProvider>
        </SignInProvider>
      </FeatureFlagProvider>
    </SessionProvider>
  );
};

export default ProvderContainer;
