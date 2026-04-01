import { NextResponse } from "next/server";
import CardModel from "@/models/Card";
import dbConnect from "@/lib/utils/dbConnet";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();

    const body = await req.json();
    const { name, bankId, category, slug, bankName } = body;

    const newCard = await CardModel.create({
      name,
      bankId,
      category,
      slug,
      bankName,
    });

    return NextResponse.json(newCard, { status: 201 });
  } catch (error) {
    console.error("Error creating card:", error);
    return NextResponse.json(
      { error: "Failed to create card" },
      { status: 500 },
    );
  }
}
