import "next-auth";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    _id?: string;
    isVerified?: boolean;
    username?: string;
    provider?: "google" | "credentials";
    hasCompletedUserInfo?: boolean;
  }

  interface Session {
    error?: "RefreshAccessTokenError";
    user: {
      _id?: string;
      isVerified?: boolean;
      username?: string;
      hasCompletedUserInfo?: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    _id?: string;
    isVerified?: boolean;
    username?: string;
    hasCompletedUserInfo?: boolean;
    error?: "RefreshAccessTokenError";
  }
}
