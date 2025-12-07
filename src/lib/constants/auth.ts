import { AuthProviderType } from "@/models/User";

export const AUTH_STATE = {
  AUTHENTICATED: "authenticated",
  UNAUTHENTICATED: "unauthenticated",
};
export const AUTH_PROVIDERS: Record<string, AuthProviderType> = {
  CREDENTIALS: "credentials",
  GOOGLE: "google",
};
