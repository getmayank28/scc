import "server-only";
import { sendTemplate } from "@/lib/whatsapp/send";

export async function sendWhatsAppOtp(
  phoneNumber: string,
  otp: string,
): Promise<void> {
  const result = await sendTemplate({
    phoneNumber,
    templateId: process.env.GUPSHUP_OTP_TEMPLATE_ID!,
    params: [otp],
    // The code itself is masked: this collection is readable from the admin side.
    text: "Your FiSense verification code is ******. It is valid for 5 minutes. Do not share this with anyone.",
  });

  if (!result.ok) {
    console.error("[otp] gupshup error:", result.error);
    throw new Error(result.error);
  }
}
