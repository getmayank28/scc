import { useFeatureFlag } from "@/contexts/FeatureContext";
import { useSignInControl } from "@/contexts/SignInContext";
import { useWaitlistControl } from "@/contexts/WaitlistContext";
import { FeatureFlagsConfig } from "../constants/featureFlags";

const useLandingCTAs = () => {
  const { openSignUpModal } = useSignInControl();
  const { openWaitlistModal } = useWaitlistControl();
  const isWaitlistEnabled = useFeatureFlag(FeatureFlagsConfig.WAITLIST);

  return isWaitlistEnabled ? openWaitlistModal : openSignUpModal;
};

export default useLandingCTAs;
