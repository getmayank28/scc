import { NextResponse } from "next/server";
import UserCardModel from "@/models/UserCard";
import "@/models/Card";
import dbConnect from "@/lib/utils/dbConnet";
import { requireUser } from "@/lib/user/requireUser";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;

  // A user may only read their own wallet.
  const auth = await requireUser();
  if (auth instanceof Response) return auth;
  if (auth.userId !== userId) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  await dbConnect();

  const userCards = await UserCardModel.find({
    userId,
  }).populate("cardId");

  return NextResponse.json(userCards);
}
