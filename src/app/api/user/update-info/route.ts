import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getToken } from "next-auth/jwt";
import mongoose from "mongoose";
import dbConnect from "@/lib/utils/dbConnet";
import User from "@/models/User";
import { userInfoSchema } from "@/schemas/userInfoSchema";

interface PhoneVerificationPayload {
  phoneNumber: string;
  verified: boolean;
}

export async function PATCH(req: NextRequest) {
  try {
    // Authenticate the session user
    const sessionToken = await getToken({
      req,
      secret: process.env.NEXT_AUTH_SECRET,
      secureCookie: process.env.NODE_ENV === "production",
    });

    if (!sessionToken?._id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = sessionToken._id as string;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = userInfoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { verificationToken, salaryRange, informationConsent, promotionalConsent } =
      parsed.data;

    // Verify the phone verification JWT issued by verify-otp
    let phonePayload: PhoneVerificationPayload;
    try {
      phonePayload = jwt.verify(
        verificationToken,
        process.env.NEXT_AUTH_SECRET!
      ) as PhoneVerificationPayload;
    } catch {
      return NextResponse.json(
        { message: "Phone verification token is invalid or expired. Please re-verify your number." },
        { status: 401 }
      );
    }

    if (!phonePayload.verified || !phonePayload.phoneNumber) {
      return NextResponse.json(
        { message: "Invalid verification token." },
        { status: 401 }
      );
    }

    await dbConnect();

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          phoneNumber: phonePayload.phoneNumber,
          isPhoneVerified: true,
          salaryRange,
          informationConsent,
          promotionalConsent,
        },
      },
      { new: true, runValidators: true }
    ).select("phoneNumber isPhoneVerified salaryRange informationConsent promotionalConsent");

    if (!updatedUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: updatedUser }, { status: 200 });
  } catch (error) {
    console.error("[update-info] error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
