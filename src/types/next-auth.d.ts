import "next-auth";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    _id?: string;
    isVerified?: boolean;
    username?: string;
    provider?: "google" | "credentials";
  }

  interface Session {
    error?: "RefreshAccessTokenError";
    user: {
      _id?: string;
      isVerified?: boolean;
      username?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    _id?: string;
    isVerified?: boolean;
    username?: string;
    error?: "RefreshAccessTokenError";
  }
}
