import { ApiResponse } from "@/lib/utils/ApiResponse";
import dbConnect from "@/lib/utils/dbConnet";
import UserModal from "@/models/User";
import { emailVerificationSchema } from "@/schemas/signUpSchema";
import z from "zod";
import { changePasswordSchema } from "@/schemas/changePasswordSchema";
import bcrypt from "bcrypt";

const ChangePasswordSchema = z
  .object({
    email: emailVerificationSchema,
  })
  .merge(changePasswordSchema);

export async function POST(request: Request) {
  await dbConnect();
  try {
    const {
      email: userEmail,
      password,
      confirmPassword,
      code,
    } = await request.json();

    if (!userEmail || !password || !confirmPassword || !code) {
      return ApiResponse.error("Missing expected payload", 400);
    }

    const queryParams = {
      email: decodeURIComponent(userEmail),
      password: decodeURIComponent(password),
      confirmPassword: decodeURIComponent(confirmPassword),
      code: decodeURIComponent(code),
    };

    const result = ChangePasswordSchema.safeParse(queryParams);

    if (!result.success) {
      const emailErrors =
        result.error.format().email?._errors ||
        result.error.format().password?._errors ||
        result.error.format().confirmPassword?._errors ||
        result.error.format().code?._errors ||
        [];
      return ApiResponse.error(
        emailErrors?.length > 0
          ? emailErrors.join(" ")
          : "Invalid query parameter",
        400
      );
    }

    const {
      email,
      password: validPassword,
      code: verificationCode,
    } = result.data;

    const user = await UserModal.findOne({ email });

    if (!user) return ApiResponse.success("Email not found", 404);

    const isCodeValid = user.verificationCode === verificationCode;
    const iscodeNotExpired =
      new Date(user.verificationCodeExpiry || "") > new Date();

    if (isCodeValid && iscodeNotExpired) {
      const hashedPassword = await bcrypt.hash(validPassword, 10);
      user.isVerified = true;
      user.password = hashedPassword;

      await user.save();

      return ApiResponse.success("Password successfully updated", 200);
    } else if (!iscodeNotExpired) {
      return ApiResponse.error("Verification code has expired", 500);
    }

    return ApiResponse.error("Invalid code", 500);
  } catch (err) {
    console.error("Error updating password", err);
    return ApiResponse.error("Error updating password", 500);
  }
}
