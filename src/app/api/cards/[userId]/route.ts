import { NextResponse } from "next/server";
import UserCardModel from "@/models/UserCard";
import "@/models/Card";
import dbConnect from "@/lib/utils/dbConnet";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;

  await dbConnect();

  const userCards = await UserCardModel.find({
    userId,
  }).populate("cardId");

  return NextResponse.json(userCards);
}
