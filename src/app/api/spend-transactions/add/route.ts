// app/api/transactions/route.ts
import { NextResponse } from "next/server";
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

    const { userId, category, amount, merchant, transactionMode, cards } = body;

    const transaction = await SpendTransactionModel.create({
      userId,
      category,
      amount,
      merchant,
      transactionMode,
      cards,
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 },
    );
  }
}
