import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import dbConnect from "@/lib/utils/dbConnet";
import { ApiResponse } from "@/lib/utils/ApiResponse";
import { isAdmin } from "@/lib/constants/admin";
import AffiliateTransaction from "@/models/AffiliateTransaction";
import OutboundClick from "@/models/OutboundClick";
import SyncState from "@/models/SyncState";

/**
 * GET /api/admin/affiliate — Cuelinks conversion overview for the admin tab.
 *
 * Gated on `isAdmin`, not just a session: unlike most admin reads this exposes
 * commission figures.
 */

const CLICK_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

const sumBy = (field: string) => [
  {
    $group: {
      _id: `$${field}`,
      count: { $sum: 1 },
      commission: { $sum: { $ifNull: ["$commission", 0] } },
    },
  },
  { $sort: { count: -1 as const } },
];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.phoneNumber)) return ApiResponse.error("Forbidden", 403);

  await dbConnect();
  const since = new Date(Date.now() - CLICK_WINDOW_MS);

  const [byStatus, byKind, bySurface, byCampaign, byAttribution, recent, unmatched, clicks, sync] =
    await Promise.all([
      AffiliateTransaction.aggregate(sumBy("status")),
      AffiliateTransaction.aggregate(sumBy("kind")),
      AffiliateTransaction.aggregate(sumBy("surface")),
      AffiliateTransaction.aggregate([...sumBy("campaignName"), { $limit: 20 }]),
      AffiliateTransaction.aggregate(sumBy("attribution")),
      AffiliateTransaction.find(
        {},
        "cuelinksId status kind campaignName cardSlug surface userId attribution commission currency transactionDate",
      )
        .sort({ updatedAt: -1 })
        .limit(50)
        .lean(),
      AffiliateTransaction.find(
        { attribution: "none" },
        "cuelinksId status campaignName commission transactionDate",
      )
        .sort({ transactionDate: -1 })
        .limit(20)
        .lean(),
      OutboundClick.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: { type: "$type", step: "$step" },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
      SyncState.find({}, "key lastRunAt cursor lastResult").lean(),
    ]);

  return ApiResponse.success("Affiliate overview", 200, {
    byStatus,
    byKind,
    bySurface,
    byCampaign,
    byAttribution,
    recent,
    unmatched,
    clicks30d: clicks,
    sync,
  });
}
