import { NextRequest, NextResponse } from "next/server";
import Portal from "@/models/Portal";
import dbConnect from "@/lib/utils/dbConnet";

// GET SINGLE
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await dbConnect();
  const { id } = await params;

  try {
    const portal = await Portal.findById(id);

    if (!portal) {
      return NextResponse.json(
        { message: "Portal not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(portal);
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch portal" },
      { status: 500 },
    );
  }
}

// UPDATE
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await dbConnect();
  const { id } = await params;

  try {
    const body = await req.json();

    const updated = await Portal.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return NextResponse.json(
        { message: "Portal not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(updated);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json(
        { message: "Slug must be unique" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { message: "Failed to update portal" },
      { status: 500 },
    );
  }
}

// DELETE
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await dbConnect();
  const { id } = await params;

  try {
    const deleted = await Portal.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { message: "Portal not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ message: "Portal deleted successfully" });
  } catch {
    return NextResponse.json(
      { message: "Failed to delete portal" },
      { status: 500 },
    );
  }
}
