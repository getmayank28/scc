import "next-auth";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    _id?: string;
    isVerified?: boolean;
    username?: string;
    phoneNumber?: string;
    hasAdvisorProfile?: boolean;
    profileIncomplete?: boolean;
    isNewUser?: boolean;
  }

  interface Session {
    error?: "RefreshAccessTokenError";
    user: {
      _id?: string;
      isVerified?: boolean;
      username?: string;
      phoneNumber?: string;
      hasAdvisorProfile?: boolean;
      profileIncomplete?: boolean;
      isNewUser?: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    _id?: string;
    isVerified?: boolean;
    username?: string;
    phoneNumber?: string;
    hasAdvisorProfile?: boolean;
    profileIncomplete?: boolean;
    isNewUser?: boolean;
    error?: "RefreshAccessTokenError";
  }
}
