import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import User from "@/models/User";
import dbConnect from "@/lib/utils/dbConnet";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    // A user may only read their own profile.
    const token = await getToken({
      req,
      secret: process.env.NEXT_AUTH_SECRET,
      secureCookie: process.env.NODE_ENV === "production",
    });
    if (!token?._id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (token._id !== id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await dbConnect();
    const user = await User.findById(id).select(
      "name email phoneNumber _id employmentType salaryRange"
    );

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        _id: user._id,
        employmentType: user.employmentType,
        salaryRange: user.salaryRange,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
