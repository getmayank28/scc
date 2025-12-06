import bcrypt from "bcrypt";
import { sendVerificationEmail } from "@/helpers/sendVerificationEmail";
import { generateVerificationCode } from "./utils";
import { User } from "@/models/User";

export const updateUserVerification = async (user: User, password: string) => {
  if (user && (user.failedLoginAttempts || 0) >= 5) {
    const cooldownTime = 20 * 60 * 1000; // 20 minutes
    const lastFailed = user.lastFailedLogin?.getTime() || 0;
    const now = Date.now();

    if (now - lastFailed < cooldownTime) {
      const minutesLeft = Math.ceil(
        (cooldownTime - (now - lastFailed)) / 60000
      );
      throw new Error(
        `Too many failed attempts. Try again in ${minutesLeft} minute(s).`
      );
    } else {
      // reset attempts after cooldown
      user.failedLoginAttempts = 0;
      await user.save();
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const { code, expiry } = generateVerificationCode();

  user.password = hashedPassword;
  user.verificationCode = code;
  user.verificationCodeExpiry = expiry;
  user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
  user.lastFailedLogin = new Date();
  await user.save();

  const emailResponse = await sendVerificationEmail({
    email: user.email,
    verificationCode: code,
  });

  if (!emailResponse.success) throw new Error(emailResponse.message);

  return user;
};
