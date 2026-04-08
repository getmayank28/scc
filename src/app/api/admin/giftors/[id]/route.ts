import { NextRequest, NextResponse } from "next/server";
import Giftor from "@/models/Giftor";
import "@/models/Bank";
import dbConnect from "@/lib/utils/dbConnet";
import CardModel from "@/models/Card";

// GET single giftor
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  await dbConnect();
  const { id } = await context.params;

  try {
    const card = await CardModel.find({ slug: id }).lean();

    const giftor = await Giftor.find({ bankId: card?.[0]?.bankId }).populate(
      "bankId",
      "name",
    );

    if (!giftor) {
      return NextResponse.json(
        { message: "Giftor not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(giftor);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch giftor", error },
      { status: 500 },
    );
  }
}

// UPDATE giftor
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  await dbConnect();
  const { id } = await context.params;

  try {
    const body = await req.json();

    const updated = await Giftor.findByIdAndUpdate(id, body, {
      new: true,
    });

    if (!updated) {
      return NextResponse.json(
        { message: "Giftor not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to update giftor", error },
      { status: 500 },
    );
  }
}

// DELETE giftor
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  await dbConnect();
  const { id } = await context.params;

  try {
    const deleted = await Giftor.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { message: "Giftor not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to delete giftor", error },
      { status: 500 },
    );
  }
}
