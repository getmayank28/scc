import { FeatureFlagsTypes } from "@/types/featureFlags";

export const FeatureFlagsConfig = {
  WAITLIST: "waitlist",
} as const;

export const featureFlags: FeatureFlagsTypes = {
  [FeatureFlagsConfig.WAITLIST]: true,
};
