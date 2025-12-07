import { ApiResponse } from "@/types/ApiResponse";
import { resend } from "@/lib/utils/resend";

interface SendVerificationEmailProps {
  email: string;
  verificationCode: string;
}

export async function sendVerificationEmail({
  email,
  verificationCode,
}: SendVerificationEmailProps): Promise<ApiResponse> {
  try {
    await resend.emails.send({
      from: "Fisense <support@gofisense.com>",
      to: [email],
      subject: "Fisense | Verification Code",
      html: `
  <div style="font-family:Arial, sans-serif; background:#f5f7fb; padding:40px;">
    <div style="
      max-width:500px;
      margin:auto;
      background:#ffffff;
      border-radius:12px;
      padding:30px;
      box-shadow:0 4px 12px rgba(0,0,0,0.08);
    ">
      <h2 style="text-align:center; color:#1a73e8; margin-bottom:10px;">
        Your Verification Code
      </h2>

      <p style="font-size:16px; color:#333; text-align:center;">
        Hello,<br>Your secure verification code is:
      </p>

      <div style="
        text-align:center;
        font-size:32px;
        font-weight:bold;
        letter-spacing:6px;
        color:#1a73e8;
        margin:25px 0;
      ">
        ${verificationCode}
      </div>

      <p style="font-size:14px; color:#555; text-align:center;">
        This code is valid for <strong>10 minutes</strong>.
      </p>

      <hr style="border:0; border-top:1px solid #eee; margin:25px 0;">

      <p style="font-size:13px; color:#777; text-align:center;">
        If you did not trigger this email, please contact us at:<br>
        <a href="mailto:support@gofisense.com" style="color:#1a73e8;">
          support@gofisense.com
        </a>
      </p>

    </div>
  </div>
`,
    });

    return { success: true, message: "Verification email sends successfully" };
  } catch (error) {
    console.error("Error sending verification email", error);
    return { success: false, message: "Failed to send verification email" };
  }
}
