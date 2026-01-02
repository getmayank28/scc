// app/api/cards/[cardId]/route.ts
import { NextResponse } from "next/server";
import CardModel from "@/models/Card";
import dbConnect from "@/lib/utils/dbConnet";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const { cardId } = await params;
  await dbConnect();

  try {
    const body = await req.json();

    const updatedCard = await CardModel.findByIdAndUpdate(
      cardId,
      {
        $set: {
          cardNumber: body.cardNumber,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedCard) {
      return NextResponse.json({ message: "Card not found" }, { status: 404 });
    }

    return NextResponse.json(updatedCard, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: "Failed to update card" },
      { status: 500 }
    );
  }
}
