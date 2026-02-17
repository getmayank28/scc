import { NextResponse } from "next/server";
import dbConnect from "@/lib/utils/dbConnet";
import FeedbackSchema from "@/models/FeedbackSchema";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await dbConnect();

    const cards = await FeedbackSchema.find({}).lean();

    return NextResponse.json(cards, { status: 200 });
  } catch (error) {
    console.error("Error fetching cards:", error);

    return NextResponse.json(
      { error: "Failed to fetch cards" },
      { status: 500 },
    );
  }
}
