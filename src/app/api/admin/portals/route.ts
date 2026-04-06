import { NextRequest, NextResponse } from "next/server";
import Portal from "@/models/Portal";
import dbConnect from "@/lib/utils/dbConnet";

// GET ALL PORTALS
export async function GET() {
  await dbConnect();

  try {
    const portals = await Portal.find().sort({ createdAt: -1 });

    return NextResponse.json(portals);
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch portals" },
      { status: 500 },
    );
  }
}

// CREATE PORTAL
export async function POST(req: NextRequest) {
  await dbConnect();

  try {
    const body = await req.json();

    const portal = await Portal.create(body);

    return NextResponse.json(portal, { status: 201 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json(
        { message: "Slug must be unique" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { message: "Failed to create portal" },
      { status: 500 },
    );
  }
}
