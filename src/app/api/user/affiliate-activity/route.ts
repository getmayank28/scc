import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import dbConnect from "@/lib/utils/dbConnet";
import { ApiResponse } from "@/lib/utils/ApiResponse";
import AffiliateTransaction, { type TxnStatus } from "@/models/AffiliateTransaction";
import Card from "@/models/Card";
import type { ActivityItem, ActivityState } from "@/types/affiliate";

/**
 * GET /api/user/affiliate-activity — the signed-in user's tracked card
 * applications and purchases, newest first.
 *
 * Status only, never amounts: the commission is our revenue, and showing it
 * would read as cashback we don't pay.
 */

const STATE: Record<TxnStatus, ActivityState> = {
  pending: "tracked",
  validated: "confirmed",
  payable: "confirmed",
  invoice_raised: "confirmed",
  paid: "confirmed",
  rejected: "not_confirmed",
};

interface Row {
  _id: unknown;
  kind: ActivityItem["kind"];
  status: TxnStatus;
  campaignName: string | null;
  cardSlug: string | null;
  transactionDate: Date | null;
  createdAt: Date;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?._id;
  if (!userId) return ApiResponse.error("Unauthorized", 401);

  await dbConnect();
  const rows = await AffiliateTransaction.find(
    { userId },
    "kind status campaignName cardSlug transactionDate createdAt",
  )
    .sort({ transactionDate: -1, createdAt: -1 })
    .limit(50)
    .lean<Row[]>();

  const slugs = [...new Set(rows.map((r) => r.cardSlug).filter((s): s is string => !!s))];
  const cards = slugs.length
    ? await Card.find({ slug: { $in: slugs } }, "slug name").lean<{ slug: string; name: string }[]>()
    : [];
  const cardName = new Map(cards.map((c) => [c.slug, c.name]));

  const items: ActivityItem[] = rows.map((r) => {
    const card = r.cardSlug ? cardName.get(r.cardSlug) : undefined;
    return {
      id: String(r._id),
      kind: r.kind,
      title:
        r.kind === "card_application"
          ? (card ?? r.campaignName ?? "Card application")
          : (r.campaignName ?? "Purchase"),
      merchant: r.campaignName,
      state: STATE[r.status],
      date: (r.transactionDate ?? r.createdAt)?.toISOString() ?? null,
    };
  });

  return ApiResponse.success("Affiliate activity", 200, items);
}
