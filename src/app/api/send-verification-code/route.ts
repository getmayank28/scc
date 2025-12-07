import { ApiResponse } from "@/lib/utils/ApiResponse";
import dbConnect from "@/lib/utils/dbConnet";
import UserModal from "@/models/User";
import { emailVerificationSchema } from "@/schemas/signUpSchema";
import z from "zod";
import { generateVerificationCode } from "../utils/utils";
import { sendVerificationEmail } from "@/helpers/sendVerificationEmail";

const EmailQuerySchema = z.object({
  email: emailVerificationSchema,
});

export async function POST(request: Request) {
  await dbConnect();
  try {
    const { email: userEmail } = await request.json();

    const queryParams = {
      email: decodeURIComponent(userEmail),
    };

    const result = EmailQuerySchema.safeParse(queryParams);

    if (!result.success) {
      const emailErrors = result.error.format().email?._errors || [];
      return ApiResponse.error(
        emailErrors?.length > 0
          ? emailErrors.join(" ")
          : "Invalid query parameter",
        400
      );
    }

    const { email } = result.data;

    const user = await UserModal.findOne({ email });

    if (!user) return ApiResponse.success("User not found", 404);

    const { code, expiry } = generateVerificationCode();

    if (user) {
      user.verificationCode = code;
      user.verificationCodeExpiry = expiry;
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      user.lastFailedLogin = new Date();

      user.save();
    }

    const response = await sendVerificationEmail({
      email,
      verificationCode: code,
    });
    if (!response.success) throw new Error(response.message);

    return ApiResponse.success("Email sent successfully", 200);
  } catch (err) {
    console.error("Error sendind verification code", err);
    return ApiResponse.error("Error sendind verification code", 500);
  }
}
