import { NextRequest, NextResponse } from "next/server";
import Partner from "@/models/Partner";
import dbConnect from "@/lib/utils/dbConnet";

interface Params {
  params: { id: string };
}

// GET ONE
export async function GET(_: NextRequest, { params }: Params) {
  await dbConnect();

  const partner = await Partner.findById(params.id).lean();

  if (!partner) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  return NextResponse.json(partner);
}

// UPDATE
export async function PATCH(req: NextRequest, { params }: Params) {
  await dbConnect();

  try {
    const body = await req.json();

    const updated = await Partner.findByIdAndUpdate(params.id, body, {
      new: true,
    }).lean();

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ message: "Update failed" }, { status: 500 });
  }
}

// DELETE
export async function DELETE(_: NextRequest, { params }: Params) {
  await dbConnect();

  await Partner.findByIdAndDelete(params.id);

  return NextResponse.json({ success: true });
}
