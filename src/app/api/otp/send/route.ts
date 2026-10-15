import { NextRequest, NextResponse } from "next/server";
import { clientIp, issueOtp } from "@/lib/otp";
import { sendOtpSchema } from "@/schemas/userInfoSchema";

// Public: sends a login code to a WhatsApp number. Verification happens inside
// the NextAuth `whatsapp-otp` provider, which signs the user in on success.
// The response is the same whether or not the number has an account.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = sendOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const result = await issueOtp(parsed.data.phoneNumber, clientIp(req.headers));

    if (!result.ok) {
      return NextResponse.json(
        { message: result.message, retryAfter: result.retryAfter },
        { status: result.status },
      );
    }

    return NextResponse.json(
      { success: true, retryAfter: result.retryAfter },
      { status: 200 },
    );
  } catch (error) {
    console.error("[otp/send] error:", error);
    return NextResponse.json(
      { message: "Failed to send OTP. Please try again." },
      { status: 500 },
    );
  }
}
