import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import Card from "@/models/Card";
import dbConnect from "@/lib/utils/dbConnet";
import { resolveLink } from "@/lib/utils/linkResolver";

export async function GET(req: NextRequest) {
  await dbConnect();

  const { searchParams } = new URL(req.url);
  const cardId = searchParams.get("cardId");

  if (!cardId) {
    return NextResponse.json({ error: "Invalid cardId" }, { status: 400 });
  }

  const card = await Card.findOne({ slug: cardId }).lean();

  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  if (!card.bankId) {
    return NextResponse.json(
      { error: "Card has no associated bank" },
      { status: 404 },
    );
  }

  const link = await resolveLink({
    cardId: card._id as Types.ObjectId,
    bankId: card.bankId,
  });

  if (!link) {
    return new NextResponse("No link available", { status: 404 });
  }
  return NextResponse.json({ success: true, data: link }, { status: 200 });
}
