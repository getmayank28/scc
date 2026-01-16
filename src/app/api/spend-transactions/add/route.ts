// app/api/transactions/route.ts
import { NextResponse } from "next/server";
import Card from "@/models/Card";
import dbConnect from "@/lib/utils/dbConnet";
import SpendTransactionModel from "@/models/SpendTransaction";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      userId,
      category,
      amount,
      merchant,
      paymentMethod,
      emi,
      cardIds,
      cardName,
      expectedBenefit,
    } = body;

    const cards = await Card.find({ _id: { $in: cardIds } });

    if (!cards.length) {
      return NextResponse.json({ error: "Invalid cards" }, { status: 400 });
    }
    console.log(cardName, expectedBenefit, "fhvfhbvhfbvhbf");
    const foundCards = cards.map((c) => ({
      cardId: c._id,
      name: c.name,
      bankName: c.bankName,
    }));
    const transaction = await SpendTransactionModel.create({
      userId,
      category,
      amount,
      merchant,
      paymentMethod,
      emi,
      cards: foundCards,
      cardName,
      expectedBenefit,
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}
