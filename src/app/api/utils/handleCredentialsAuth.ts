import dbConnect from "@/lib/utils/dbConnet";
import UserModal from "@/models/User";
import { createUserWithVerification } from "./createUserWithVerification";
import { updateUserVerification } from "./updateUserVerification";
import { validatePassword } from "./validatePassword";
import { AUTH_PROVIDERS } from "@/lib/constants/auth";
import bcrypt from "bcrypt";

export const handleCredentialsAuth = async (
  credentials: Record<"email" | "password", string> | undefined
): Promise<any | null> => {
  if (!credentials?.email || !credentials?.password) {
    throw new Error("Missing credentials");
  }

  await dbConnect();

  const user = await UserModal.findOne({ email: credentials.email });

  // New User — Create + Send Code
  if (!user) {
    return await createUserWithVerification(
      credentials.email,
      credentials.password
    );
  }

  // User Exists but Not Verified — Update & Resend Code
  if (!user.isVerified) {
    return await updateUserVerification(user, credentials.password);
  }

  if (user && user.provider.includes(AUTH_PROVIDERS.GOOGLE) && !user.password) {
    const hashedPassword = await bcrypt.hash(credentials.password, 10);
    user.password = hashedPassword;
    user.failedLoginAttempts = 0;
    user.lastFailedLogin = new Date();
    user.provider = [...user.provider, AUTH_PROVIDERS.GOOGLE];

    user.save();

    return user;
  }
  // Verified User — Validate Password
  const isValid = await validatePassword(credentials.password, user.password!);
  if (!isValid) {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    user.lastFailedLogin = new Date();
    throw new Error("Incorrect Password");
  }

  return user;
};
