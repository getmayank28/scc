import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import dbConnect from "@/lib/utils/dbConnet";
import UserModal from "@/models/User";
import { handleCredentialsAuth } from "../../utils/handleCredentialsAuth";
import { AUTH_PROVIDERS } from "@/lib/constants/auth";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: handleCredentialsAuth,
    }),

    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],

  callbacks: {
    async signIn({ user }) {
      await dbConnect();

      let existingUser = await UserModal.findOne({ email: user.email });
      if (!existingUser) {
        existingUser = await UserModal.create({
          // @ts-expect-error some
          name: user.name,
          email: user.email!,
          isVerified: true,
          provider: [AUTH_PROVIDERS.GOOGLE],
        });
      }
      user._id = existingUser._id.toString();
      user.isVerified = existingUser.isVerified;
      const existingUserWithCredentialsNowTryingGoogle =
        existingUser &&
        existingUser.provider.includes(AUTH_PROVIDERS.CREDENTIALS) &&
        user &&
        !user.provider;

      if (existingUserWithCredentialsNowTryingGoogle) {
        existingUser.isVerified = true;
        existingUser.provider = [
          ...existingUser.provider,
          AUTH_PROVIDERS.GOOGLE,
        ];
        await existingUser.save();
        return true;
      }

      return true;
    },

    async jwt({ token, user }) {
      await dbConnect();
      if (user) {
        token._id = user._id?.toString();
        token.isVerified = user.isVerified;
        token.name = user.name;
        token.email = user.email;
      } else {
        const dbUser = await UserModal.findById(token._id);
        if (dbUser) {
          token.isVerified = dbUser.isVerified;
        }
      }

      return token;
    },

    async session({ session, token }) {
      session.user._id = token._id;
      session.user.isVerified = token.isVerified;
      session.user.name = token.name;
      session.user.email = token.email;

      return session;
    },
  },

  pages: {
    signIn: "/sign-in",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60,
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    callbackUrl: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.callback-url"
          : "next-auth.callback-url",
      options: {
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Host-next-auth.csrf-token"
          : "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },

  secret: process.env.NEXT_AUTH_SECRET,
};
