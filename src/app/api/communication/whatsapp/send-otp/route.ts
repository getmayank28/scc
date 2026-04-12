import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/utils/dbConnet";
import OtpStore from "@/models/OtpStore";
import { sendOtpSchema } from "@/schemas/userInfoSchema";

const OTP_TTL_SECONDS = 300; // 5 minutes
const RESEND_COOLDOWN_SECONDS = 60; // 1 minute between resends
const OTP_LENGTH = 6;

function generateOtp(): string {
  const digits = Array.from({ length: OTP_LENGTH }, () =>
    Math.floor(Math.random() * 10),
  );
  return digits.join("");
}

async function sendWhatsAppOtp(
  phoneNumber: string,
  otp: string,
): Promise<void> {
  const destination = `91${phoneNumber}`; // India country code
  const message = `Your FiSense verification code is *${otp}*. It is valid for 5 minutes. Do not share this with anyone.`;

  const params = new URLSearchParams({
    channel: "whatsapp",
    source: process.env.GUPSHUP_SOURCE_NUMBER!,
    destination,
    "src.name": process.env.GUPSHUP_APP_NAME!,
    message: JSON.stringify({
      type: "text",
      text: message,
    }),
  });
  const res = await fetch("https://api.gupshup.io/wa/api/v1/msg", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      apikey: process.env.GUPSHUP_API_KEY!,
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.log(errorText, "fjhvbhfbhvbfhbvhf");
    throw new Error(`Gupshup API error: ${res.status} — ${errorText}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();
    const parsed = sendOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const { phoneNumber } = parsed.data;

    // Rate limit: block if an OTP was sent less than RESEND_COOLDOWN_SECONDS ago
    const recentOtp = await OtpStore.findOne({ phoneNumber }).sort({
      createdAt: -1,
    });

    if (recentOtp) {
      const secondsSinceSent =
        (Date.now() - new Date(recentOtp.createdAt).getTime()) / 1000;
      if (secondsSinceSent < RESEND_COOLDOWN_SECONDS) {
        const retryAfter = Math.ceil(
          RESEND_COOLDOWN_SECONDS - secondsSinceSent,
        );
        return NextResponse.json(
          {
            message: `Please wait ${retryAfter} seconds before requesting another OTP.`,
            retryAfter,
          },
          { status: 429 },
        );
      }
    }

    // Delete any existing OTPs for this phone
    await OtpStore.deleteMany({ phoneNumber });

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_TTL_SECONDS * 1000);

    await OtpStore.create({ phoneNumber, otp, expiresAt });

    await sendWhatsAppOtp(phoneNumber, otp);

    return NextResponse.json(
      { success: true, retryAfter: RESEND_COOLDOWN_SECONDS },
      { status: 200 },
    );
  } catch (error) {
    console.error("[send-otp] error:", error);
    return NextResponse.json(
      { message: "Failed to send OTP. Please try again." },
      { status: 500 },
    );
  }
}
