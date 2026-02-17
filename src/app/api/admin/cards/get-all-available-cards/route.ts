import { NextResponse } from "next/server";
import CardModel from "@/models/Card";
import dbConnect from "@/lib/utils/dbConnet";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();

    const cards = await CardModel.find({}).lean();

    return NextResponse.json(cards, { status: 200 });
  } catch (error) {
    console.error("Error fetching cards:", error);

    return NextResponse.json(
      { error: "Failed to fetch cards" },
      { status: 500 },
    );
  }
}
