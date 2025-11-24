import { resend } from "@/lib/utils/resend";
import { ApiResponse } from "@/types/ApiResponse";
import { EmailTemplate } from "../../emails/emailsTemplate";

interface SendVerificationEmailProps {
  email: string;
  username: string;
  verificationCode: string;
}

export async function sendVerificationEmail({
  email,
  username,
  verificationCode,
}: SendVerificationEmailProps): Promise<ApiResponse> {
  try {
    await resend.emails.send({
      from: "Acme <onboarding@resend.dev>",
      to: [email],
      subject: "Fisense | Verification code",
      react: EmailTemplate({ username, verificationCode }),
    });
    return { success: true, message: "Verification email sends successfully" };
  } catch (error) {
    console.error("Error sending verification email", error);
    return { success: false, message: "Failed to send verification email" };
  }
}
