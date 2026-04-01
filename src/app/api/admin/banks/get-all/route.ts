import { NextResponse } from "next/server";
import dbConnect from "@/lib/utils/dbConnet";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import Bank from "@/models/Bank";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await dbConnect();

    const banks = await Bank.find({}).lean();

    return NextResponse.json(banks, { status: 200 });
  } catch (error) {
    console.error("Error fetching cards:", error);

    return NextResponse.json(
      { error: "Failed to fetch cards" },
      { status: 500 },
    );
  }
}
