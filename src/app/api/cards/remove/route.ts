import { NextResponse } from "next/server";
import UserCardModel from "@/models/UserCard";
import dbConnect from "@/lib/utils/dbConnet";

export async function DELETE(req: Request) {
  await dbConnect();

  try {
    const { userId, cardId } = await req.json();

    if (!userId || !cardId) {
      return NextResponse.json(
        { message: "userId and cardId are required" },
        { status: 400 }
      );
    }

    const deleted = await UserCardModel.findOneAndDelete({
      userId,
      cardId,
    });

    if (!deleted) {
      return NextResponse.json(
        { message: "User does not own this card" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Card removed successfully" },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { message: "Failed to remove card" },
      { status: 500 }
    );
  }
}
