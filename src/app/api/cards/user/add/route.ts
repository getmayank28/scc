import { NextResponse } from "next/server";
import UserCardModel from "@/models/UserCard";
import dbConnect from "@/lib/utils/dbConnet";
import { requireUser } from "@/lib/user/requireUser";

export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth instanceof Response) return auth;
  const { userId } = auth;

  await dbConnect();

  const { cardId } = await req.json();

  try {
    const userCard = await UserCardModel.create({
      userId,
      cardId,
    });

    return NextResponse.json(userCard, { status: 201 });
  } catch (err: unknown) {
    // @ts-expect-error some
    if (err.code === 11000) {
      return NextResponse.json(
        { message: "User already owns this card" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: "Failed to add card" },
      { status: 500 }
    );
  }
}
