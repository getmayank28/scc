import { NextApiRequest, NextApiResponse } from "next";
import Card from "@/models/Card";
import dbConnect from "@/lib/utils/dbConnet";
import { resolveLink } from "@/lib/utils/linkResolver";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  await dbConnect();

  const { cardId } = req.query;

  if (!cardId || typeof cardId !== "string") {
    return res.status(400).json({ error: "Invalid cardId" });
  }

  const card = await Card.findById(cardId).lean();

  if (!card) {
    return res.status(404).json({ error: "Card not found" });
  }

  const link = await resolveLink({
    cardId: card._id,
    bankId: card.bankId,
    context: {
      geo: "IN",
      device: "web",
    },
  });

  if (!link) {
    return res.status(404).send("No link available");
  }

  return res.redirect(302, link.url);
}
