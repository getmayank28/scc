// app/api/cards/search/route.ts
import dbConnect from "@/lib/utils/dbConnet";
import CardModel from "@/models/Card";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    await dbConnect();

    const cards = await CardModel.find({
      name: { $regex: query, $options: "i" }, // case-insensitive search
    })
      .select("_id name bankName")
      .limit(10)
      .lean();

    return NextResponse.json(cards);
  } catch (error) {
    console.error("Card search error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
