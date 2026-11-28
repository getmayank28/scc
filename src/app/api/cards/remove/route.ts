import { NextResponse } from "next/server";
import UserCardModel from "@/models/UserCard";
import dbConnect from "@/lib/utils/dbConnet";
import { requireUser } from "@/lib/user/requireUser";

export async function DELETE(req: Request) {
  const auth = await requireUser();
  if (auth instanceof Response) return auth;
  const { userId } = auth;

  await dbConnect();

  try {
    const { cardId } = await req.json();

    if (!cardId) {
      return NextResponse.json(
        { message: "cardId is required" },
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
