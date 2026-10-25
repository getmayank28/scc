import { NextAuthOptions } from "next-auth";
import { after } from "next/server";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "@/lib/utils/dbConnet";
import UserModal from "@/models/User";
import { AUTH_PROVIDERS } from "@/lib/constants/auth";
import { verifyOtp } from "@/lib/otp";
import { verifyOtpSchema } from "@/schemas/userInfoSchema";
import {
  ATTRIBUTION_COOKIE,
  parseAttribution,
  readCookie,
} from "@/lib/analytics/attribution";
import { clientIp, sendMetaEvent } from "@/lib/analytics/metaCapi";
import {
  hasAdvisorProfile,
  missingProfileFields,
} from "@/lib/user/profileStatus";

type ProfileSource = {
  name?: string;
  email?: string;
  phoneNumber?: string;
  employmentType?: string;
  salaryRange?: string;
};

function profileFlags(user: ProfileSource) {
  return {
    phoneNumber: user.phoneNumber,
    hasAdvisorProfile: hasAdvisorProfile(user),
    profileIncomplete: missingProfileFields(user).length > 0,
  };
}

export const authOptions: NextAuthOptions = {
  providers: [
    // Login and sign-up are the same step: a verified WhatsApp number either
    // finds the existing account or creates one.
    CredentialsProvider({
      id: "whatsapp-otp",
      name: "WhatsApp OTP",
      credentials: {
        phoneNumber: { label: "Mobile number", type: "tel" },
        otp: { label: "OTP", type: "text" },
        consent: { label: "Consent", type: "text" },
      },
      async authorize(credentials, req) {
        // The sign-in checkbox (terms + WhatsApp messages) is mandatory.
        if (credentials?.consent !== "true") {
          throw new Error("Please accept the terms to continue");
        }

        const parsed = verifyOtpSchema.safeParse(credentials);
        if (!parsed.success) throw new Error(parsed.error.issues[0].message);
        const { phoneNumber, otp } = parsed.data;

        const result = await verifyOtp(phoneNumber, otp);
        if (!result.ok) throw new Error(result.message);

        await dbConnect();
        // Every user who got past the old onboarding gate verified their
        // number there, so existing accounts are found by it.
        let user = await UserModal.findOne({
          phoneNumber,
          isPhoneVerified: true,
        });
        const isNewUser = !user;
        if (user) {
          if (!user.provider.includes(AUTH_PROVIDERS.WHATSAPP)) {
            user.provider = [...user.provider, AUTH_PROVIDERS.WHATSAPP];
          }
          // Ticked again on this login.
          user.informationConsent = true;
          user.promotionalConsent = true;
          await user.save();
        } else {
          const headers = (req?.headers ?? {}) as Record<string, string | undefined>;
          const cookie = headers.cookie;
          const signupAttribution = parseAttribution(readCookie(cookie, ATTRIBUTION_COOKIE));
          // Consent comes from the mandatory checkbox on the sign-in screen,
          // which covers terms and WhatsApp updates.
          user = await UserModal.create({
            phoneNumber,
            isPhoneVerified: true,
            isVerified: true,
            provider: [AUTH_PROVIDERS.WHATSAPP],
            informationConsent: true,
            promotionalConsent: true,
            ...(signupAttribution ? { signupAttribution } : {}),
          });

          // Server copy of the browser's CompleteRegistration; same event id
          // (`reg_<userId>`, see SignInSection) so Meta counts it once.
          const userId = user._id.toString();
          after(() =>
            sendMetaEvent({
              eventName: "CompleteRegistration",
              eventId: `reg_${userId}`,
              eventSourceUrl: headers.referer,
              userId,
              phoneNumber,
              ip: clientIp(headers["x-forwarded-for"]),
              userAgent: headers["user-agent"],
              fbp: readCookie(cookie, "_fbp"),
              fbc: readCookie(cookie, "_fbc"),
              attribution: signupAttribution,
              customData: { method: "whatsapp_otp" },
            }),
          );
        }

        return {
          id: user._id.toString(),
          _id: user._id.toString(),
          name: user.name,
          email: user.email,
          isVerified: true,
          isNewUser,
          ...profileFlags(user),
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token._id = user._id?.toString();
        token.isVerified = user.isVerified;
        token.name = user.name;
        token.email = user.email;
        token.phoneNumber = user.phoneNumber;
        token.hasAdvisorProfile = user.hasAdvisorProfile;
        token.profileIncomplete = user.profileIncomplete;
        // Set once at login; the client reads it right after signIn() to
        // tell a sign-up from a returning login.
        token.isNewUser = user.isNewUser;
      } else {
        await dbConnect();
        const dbUser = await UserModal.findById(token._id).lean<ProfileSource & { isVerified: boolean }>();
        if (dbUser) {
          token.isVerified = dbUser.isVerified;
          token.name = dbUser.name;
          token.email = dbUser.email;
          Object.assign(token, profileFlags(dbUser));
        }
      }

      return token;
    },

    async session({ session, token }) {
      session.user._id = token._id;
      session.user.isVerified = token.isVerified;
      session.user.name = token.name;
      session.user.email = token.email;
      session.user.phoneNumber = token.phoneNumber;
      session.user.hasAdvisorProfile = token.hasAdvisorProfile;
      session.user.profileIncomplete = token.profileIncomplete;
      session.user.isNewUser = token.isNewUser;

      return session;
    },
  },

  pages: {
    signIn: "/sign-in",
  },
  session: {
    strategy: "jwt",
    // Every fresh login costs a WhatsApp message, so sessions last a month.
    maxAge: 60 * 60 * 24 * 30,
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
