import { NextResponse } from "next/server";
import CardModel from "@/models/Card";
import dbConnect from "@/lib/utils/dbConnet";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

interface Params {
  params: { id: string };
}

export async function PUT(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await dbConnect();

    const body = await req.json();
    const updatedCard = await CardModel.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    });

    if (!updatedCard) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    return NextResponse.json(updatedCard, { status: 200 });
  } catch (error) {
    console.error("Error updating card:", error);
    return NextResponse.json(
      { error: "Failed to update card" },
      { status: 500 },
    );
  }
}

export async function DELETE(_: Request, { params }: Params) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await dbConnect();

    const deletedCard = await CardModel.findByIdAndDelete(params.id);

    if (!deletedCard) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Card deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting card:", error);
    return NextResponse.json(
      { error: "Failed to delete card" },
      { status: 500 },
    );
  }
}
