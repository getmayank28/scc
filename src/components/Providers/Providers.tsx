"use client";
import { StateProviders } from "@/contexts/StateProvider";
import { SessionProvider} from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { SidebarContainer } from "../SidebarConatainer/SidebarConatainer";
import SignInModal from "../SignInModal/SignInModal";
import { SignInProvider } from "@/contexts/SignInContext";
import { WaitlistProvider } from "@/contexts/WaitlistContext";
import { FeatureFlagProvider } from "@/contexts/FeatureContext";
import { featureFlags } from "@/lib/constants/featureFlags";
import { ChatContextProvider } from "@/contexts/ChatContext";
import { WebSocketConnectionProvider } from "@/contexts/WebSocketConnection";
import BottomBar from "../BottomBar/BottomBar";
import { usePathname } from "next/navigation";
import AnalyticsIdentifier from "./AnalyticsIdentifier";


const ProvderContainer = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const isHiddenRoute =
    pathname?.includes("/chat") ||
    pathname?.startsWith("/sale") ||
    [
      "/",
      "/about",
      "/sign-up",
      "/sign-in",
      "/verify",
      "/tools/saving-calculator",
      "/card-value-calculator",
      "/change-password",
      "/privacy-policy",
      "/legal-compliance",
      "/terms",
      "/affiliate-disclosure",
      "/user-info",
    ]?.includes(pathname);

  return (
    <SessionProvider>
      <AnalyticsIdentifier />
      <FeatureFlagProvider flags={featureFlags}>
        <SignInProvider>
          <ChatContextProvider>
            <WaitlistProvider>
              <Toaster position="top-right" />
              <StateProviders>
                <WebSocketConnectionProvider>
                  <SignInModal />
                  {isHiddenRoute ? <></> : <BottomBar />}
                  <div
                    className={`${isHiddenRoute ? "max-md:pb-0" : "max-md:pb-22"}`}
                  >
                    <SidebarContainer>
                      {children}
                      </SidebarContainer>
                  </div>
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
