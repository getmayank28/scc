import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/utils/dbConnet";
import OtpStore from "@/models/OtpStore";
import { verifyOtpSchema } from "@/schemas/userInfoSchema";

const MAX_ATTEMPTS = 3;
// Token is valid for 30 minutes — enough to fill out the rest of the form
const VERIFICATION_TOKEN_TTL_SECONDS = 30 * 60;

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();
    const parsed = verifyOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { phoneNumber, otp } = parsed.data;

    const record = await OtpStore.findOne({ phoneNumber }).sort({
      createdAt: -1,
    });

    if (!record) {
      return NextResponse.json(
        { message: "OTP expired or not found. Please request a new one." },
        { status: 404 }
      );
    }

    // Check if OTP has expired (belt-and-suspenders beyond MongoDB TTL)
    if (new Date() > record.expiresAt) {
      await OtpStore.deleteOne({ _id: record._id });
      return NextResponse.json(
        { message: "OTP has expired. Please request a new one." },
        { status: 410 }
      );
    }

    // Increment attempt count before checking
    record.attempts += 1;
    await record.save();

    if (record.attempts > MAX_ATTEMPTS) {
      await OtpStore.deleteOne({ _id: record._id });
      return NextResponse.json(
        {
          message:
            "Too many incorrect attempts. Please request a new OTP.",
        },
        { status: 429 }
      );
    }

    if (record.otp !== otp) {
      const attemptsLeft = MAX_ATTEMPTS - record.attempts;
      return NextResponse.json(
        {
          message: `Incorrect OTP. ${attemptsLeft > 0 ? `${attemptsLeft} attempt(s) remaining.` : "No attempts remaining."}`,
        },
        { status: 400 }
      );
    }

    // OTP is correct — remove it and issue a short-lived verification token
    await OtpStore.deleteOne({ _id: record._id });

    const verificationToken = jwt.sign(
      { phoneNumber, verified: true },
      process.env.NEXT_AUTH_SECRET!,
      { expiresIn: VERIFICATION_TOKEN_TTL_SECONDS }
    );

    return NextResponse.json({ success: true, verificationToken }, { status: 200 });
  } catch (error) {
    console.error("[verify-otp] error:", error);
    return NextResponse.json(
      { message: "Failed to verify OTP. Please try again." },
      { status: 500 }
    );
  }
}
