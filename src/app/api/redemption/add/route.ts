import dbConnect from "@/lib/utils/dbConnet";
import Redemption from "@/models/Redemption";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/options";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    const userId = session?.user?._id;

    const body = await req.json();
    const { cardName, points, redemptionOptions } = body;

    if (!userId || !cardName || !points || !redemptionOptions) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const reward = await Redemption.create({
      userId,
      cardName,
      points,
      redemptionOptions,
    });

    return NextResponse.json({ success: true, data: reward }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create reward" },
      { status: 500 },
    );
  }
}
