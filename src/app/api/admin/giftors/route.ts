import { NextRequest, NextResponse } from "next/server";
import Giftor from "@/models/Giftor";
import "@/models/Bank"; // important for populate
import dbConnect from "@/lib/utils/dbConnet";

// GET all giftors
export async function GET() {
  await dbConnect();

  try {
    const giftors = await Giftor.find()
      .populate("bankId", "name")
      .sort({ createdAt: -1 });

    return NextResponse.json(giftors);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch giftors", error },
      { status: 500 },
    );
  }
}

// CREATE giftor
export async function POST(req: NextRequest) {
  await dbConnect();

  try {
    const body = await req.json();

    const giftor = await Giftor.create(body);

    return NextResponse.json(giftor, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to create giftor", error },
      { status: 500 },
    );
  }
}
