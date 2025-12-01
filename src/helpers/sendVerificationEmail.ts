import { EmailTemplate } from "@/emails/EmailsTemplate";
import { ApiResponse } from "@/types/ApiResponse";
import { Resend } from "resend";

interface SendVerificationEmailProps {
  email: string;
  username: string;
  verificationCode: string;
}

const resend = new Resend("re_dkHwXEzF_3Hm1pbQ9GJm9LzBN1oDFdWpQ");

export async function sendVerificationEmail({
  email,
  username,
  verificationCode,
}: SendVerificationEmailProps): Promise<ApiResponse> {
  try {
    await resend.emails.send({
      from: "Fisense <support@gofisense.com>",
      to: [email],
      subject: "Fisense | Verification code",
      html: `<div><h1>Hello ${username}</h1><h1>verifictaion code: ${verificationCode}</h1></div>`,
    });

    return { success: true, message: "Verification email sends successfully" };
  } catch (error) {
    console.error("Error sending verification email", error);
    return { success: false, message: "Failed to send verification email" };
  }
}
