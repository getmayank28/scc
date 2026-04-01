import { NextRequest, NextResponse } from "next/server";
import Partner from "@/models/Partner";
import dbConnect from "@/lib/utils/dbConnet";

// GET ONE
export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await dbConnect();

  const { id } = await params;

  const partner = await Partner.findById(id).lean();

  if (!partner) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  return NextResponse.json(partner);
}

// UPDATE
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await dbConnect();

  try {
    const { id } = await params;
    const body = await req.json();

    const updated = await Partner.findByIdAndUpdate(id, body, {
      new: true,
    }).lean();

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ message: "Update failed" }, { status: 500 });
  }
}

// DELETE
export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await dbConnect();

  const { id } = await params;

  await Partner.findByIdAndDelete(id);

  return NextResponse.json({ success: true });
}
