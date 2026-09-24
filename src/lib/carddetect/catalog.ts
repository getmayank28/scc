// DB-backed catalog load for resolution. Split from resolve.ts so the scoring
// logic stays pure (and script/test-drivable) while the Mongo access stays
// server-only.

import "server-only";

import dbConnect from "@/lib/utils/dbConnet";
import CardModel from "@/models/Card";
import { distinctive, tokenize, type CatalogCard } from "./resolve";

let cache: { at: number; cards: CatalogCard[] } | null = null;
const TTL_MS = 60_000;

/** Active catalog cards, tokenized once and cached process-locally (60s TTL). */
export async function loadCatalog(): Promise<CatalogCard[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.cards;
  await dbConnect();
  const rows = await CardModel.find({ is_active: { $ne: false } })
    .select({ slug: 1, name: 1, bankName: 1 })
    .lean();

  const cards: CatalogCard[] = (rows as unknown as Array<{
    _id: unknown;
    slug?: string;
    name?: string;
    bankName?: string;
  }>)
    // Guard against the known ~342 empty `card_*` duplicates: a real card has
    // a slug-style id and a name.
    .filter((r) => r.slug && r.name)
    .map((r) => ({
      cardId: String(r._id),
      slug: r.slug as string,
      name: r.name as string,
      bankName: r.bankName ?? "",
      tokens: distinctive(tokenize(r.name as string)),
    }));

  cache = { at: Date.now(), cards };
  return cards;
}
