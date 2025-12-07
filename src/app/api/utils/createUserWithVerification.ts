import bcrypt from "bcrypt";
import UserModal from "@/models/User";
import { sendVerificationEmail } from "@/helpers/sendVerificationEmail";
import { generateVerificationCode } from "./utils";
import { AUTH_PROVIDERS } from "@/lib/constants/auth";

export const createUserWithVerification = async (
  email: string,
  password: string
) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const { code, expiry } = generateVerificationCode();

  const newUser = await UserModal.create({
    email,
    password: hashedPassword,
    verificationCode: code,
    verificationCodeExpiry: expiry,
    isVerified: false,
    provider: [AUTH_PROVIDERS.CREDENTIALS],
    failedLoginAttempts: 0,
    lastFailedLogin: undefined,
  });

  const response = await sendVerificationEmail({
    email,
    verificationCode: code,
  });
  if (!response.success) throw new Error(response.message);

  return newUser;
};
