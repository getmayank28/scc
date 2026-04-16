import { NextResponse } from "next/server";
import mongoose from "mongoose";
import User from "@/models/User";
import dbConnect from "@/lib/utils/dbConnet";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    await dbConnect();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });
    }

    const user = await User.findById(id).select("name email _id employmentType salaryRange");

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        name: user.name,
        email: user.email,
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
