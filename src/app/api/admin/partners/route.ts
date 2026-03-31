import { NextRequest, NextResponse } from "next/server";
import Partner from "@/models/Partner";
import dbConnect from "@/lib/utils/dbConnet";

export async function GET() {
  await dbConnect();

  const partners = await Partner.find().sort({ createdAt: -1 }).lean();

  return NextResponse.json(partners);
}

export async function POST(req: NextRequest) {
  await dbConnect();

  try {
    const body = await req.json();

    const partner = await Partner.create(body);

    return NextResponse.json(partner, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to create partner" },
      { status: 500 },
    );
  }
}
