import { NextRequest, NextResponse } from "next/server";
import Giftor from "@/models/Giftor";
import "@/models/Bank";
import dbConnect from "@/lib/utils/dbConnet";
import CardModel from "@/models/Card";
import { resolveBankForCardSlug } from "@/lib/utils/resolveCardBank";

// GET single giftor
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  await dbConnect();
  const { id } = await context.params;

  try {
    const card = await CardModel.findOne({ slug: id }).lean<{
      bankId?: unknown;
    } | null>();

    if (!card) {
      return NextResponse.json({ message: "Card not found" }, { status: 404 });
    }

    // `bankId` is the intended join, but it is currently null on every active
    // card, so fall back to recovering the bank from the slug. See
    // `resolveCardBank` for why the card's own `bankName` cannot be used — it
    // holds the network ("visa"), which is what this route used to surface as
    // a bank name in the caller's error message.
    const bankId =
      card.bankId ?? (await resolveBankForCardSlug(id))?._id ?? null;

    if (!bankId) {
      return NextResponse.json([]);
    }

    const giftor = await Giftor.find({ bankId }).populate("bankId", "name");

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
