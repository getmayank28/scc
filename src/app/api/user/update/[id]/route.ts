import { NextResponse } from "next/server";
import User from "@/models/User";
import mongoose from "mongoose";
import dbConnect from "@/lib/utils/dbConnet";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await dbConnect();

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });
    }

    const body = await req.json();
    const { name, email } = body;

    // Ensure at least one field is provided
    if (!name && !email) {
      return NextResponse.json(
        { message: "Nothing to update" },
        { status: 400 }
      );
    }

    // Build update object safely
    const updateData: { name?: string; email?: string } = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("name email -_id");

    if (!updatedUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error: unknown) {
    // Handle duplicate email error
    // @ts-expect-error some
    if (error.code === 11000) {
      return NextResponse.json(
        { message: "Email already in use" },
        { status: 409 }
      );
    }

    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
