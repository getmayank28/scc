import {
  invalidateBankCache,
  invalidateCardCache,
} from "@/lib/utils/linkResolver";
import Link from "@/models/Link";
import { LinkProps } from "@/types/link";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

// CREATE LINK
export async function createLink(req: NextRequest) {
  const body = await req.json();
  const { cardId, bankId, partnerId, partnerName, url, type, active } = body;

  if (!cardId && !bankId) {
    return NextResponse.json(
      { message: "Card ID or Bank ID is required" },
      { status: 400 },
    );
  }

  if (!url) {
    return NextResponse.json({ message: "URL is required" }, { status: 400 });
  }

  let link;
  if (cardId) {
    link = await Link.create({
      cardId,
      partnerId,
      partnerName,
      url,
      type,
      active,
    });
    await invalidateCardCache(cardId.toString());
  } else {
    link = await Link.create({
      bankId,
      partnerId,
      partnerName,
      url,
      type,
      active,
    });
    await invalidateBankCache(bankId.toString());
  }

  return NextResponse.json(link, { status: 201 });
}

// UPDATE LINK
export async function updateLink(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Valid ID required" }, { status: 400 });
  }

  const updateData = await req.json();

  const existingLink = await Link.findById(id);
  if (!existingLink) {
    return NextResponse.json({ message: "Link not found" }, { status: 404 });
  }

  const updated = await Link.findByIdAndUpdate(id, updateData, { new: true });

  if (existingLink.cardId)
    await invalidateCardCache(existingLink.cardId.toString());
  if (existingLink.bankId)
    await invalidateBankCache(existingLink.bankId.toString());

  return NextResponse.json(updated, { status: 200 });
}

// DELETE LINK
export async function deleteLink(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Valid ID required" }, { status: 400 });
  }

  const existingLink = await Link.findById(id);
  if (!existingLink) {
    return NextResponse.json({ message: "Link not found" }, { status: 404 });
  }

  await Link.findByIdAndDelete(id);

  if (existingLink.cardId)
    await invalidateCardCache(existingLink.cardId.toString());
  if (existingLink.bankId)
    await invalidateBankCache(existingLink.bankId.toString());

  return NextResponse.json(
    { message: "Deleted successfully" },
    { status: 200 },
  );
}

export async function getLinks(req: NextRequest, res: NextResponse) {
  const type = req.nextUrl.searchParams.get("type");

  try {
    const filter: Partial<LinkProps> = {};
    // 🔹 Type-based filtering
    if (type === "card") {
      // @ts-expect-error some check
      filter.cardId = { $exists: true };
      // @ts-expect-error some check
      filter.bankId = { $exists: false };
    }

    if (type === "bank") {
      // @ts-expect-error some check
      filter.bankId = { $exists: true };
      // @ts-expect-error some check
      filter.cardId = { $exists: false };
    }

    const links = await Link.find(filter)
      .sort({ createdAt: -1 })
      .lean<LinkProps[]>();

    return NextResponse.json(links, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to fetch links" },
      { status: 500 },
    );
  }
}
