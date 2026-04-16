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

    const { verificationToken, employmentType, salaryRange, informationConsent, promotionalConsent } =
      parsed.data;

    // Verify the phone verification JWT issued by verify-otp
    let phonePayload: PhoneVerificationPayload;

    // In development, accept the localhost dev token and extract phone from body
    if (
      process.env.NODE_ENV === "development" &&
      verificationToken === "localhost-dev-token"
    ) {
      phonePayload = { phoneNumber: body.phoneNumber ?? "8859167328", verified: true };
    } else {
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
    }

    await dbConnect();

    const updateFields: Record<string, unknown> = {
      phoneNumber: phonePayload.phoneNumber,
      isPhoneVerified: true,
      employmentType,
      informationConsent,
      promotionalConsent,
    };

    if (employmentType === "student_unemployed") {
      updateFields.salaryRange = undefined;
    } else {
      updateFields.salaryRange = salaryRange;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: updateFields,
      },
      { new: true, runValidators: true }
    ).select("phoneNumber isPhoneVerified employmentType salaryRange informationConsent promotionalConsent");

    if (!updatedUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: updatedUser }, { status: 200 });
  } catch (error) {
    console.error("[update-info] error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
