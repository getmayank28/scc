import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import dbConnect from "@/lib/utils/dbConnet";
import { ApiResponse } from "@/lib/utils/ApiResponse";
import Redemption from "@/models/Redemption";

export const runtime = "nodejs";

const MAX_CARDS = 4;

interface StoredOption {
  redemptionOptionTitle: string;
  pointConversionRatioInInr?: number | null;
  points?: number | null;
}

interface StoredRedemption {
  cardName: string;
  points: number;
  redemptionOptions: StoredOption[];
  createdAt: Date;
}

export interface PointsSnapshot {
  cardName: string;
  points: number;
  /** When the user last checked this card's points on /redemption. */
  checkedAt: string;
  best: { title: string; valueInr: number };
  /** The lowest-value option, when it is meaningfully below the best. */
  worst: { title: string; valueInr: number } | null;
}

/**
 * GET /api/redemption/latest — the user's most recent points check per card,
 * with what those points are worth at the best and worst redemption options.
 *
 * Users re-check the same card often, so only the newest check per card is
 * used. An option's value is points × its ₹-per-point ratio; `highestReturn`
 * on the stored rows is the best of these repeated on every option, so it
 * can't tell options apart and isn't read.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?._id;
  if (!userId) return ApiResponse.error("Unauthorized", 401);

  try {
    await dbConnect();
    const rows = await Redemption.find(
      { userId },
      "cardName points redemptionOptions createdAt",
    )
      .sort({ createdAt: -1 })
      .limit(200)
      .lean<StoredRedemption[]>();

    const seen = new Set<string>();
    const snapshots: PointsSnapshot[] = [];
    for (const r of rows) {
      const key = r.cardName.trim().toLowerCase();
      if (seen.has(key)) continue;

      const valued = (r.redemptionOptions ?? [])
        .map((o) => ({
          title: o.redemptionOptionTitle,
          valueInr: Math.round((o.points ?? r.points) * (o.pointConversionRatioInInr ?? 0)),
        }))
        .filter((o) => o.valueInr > 0)
        .sort((a, b) => b.valueInr - a.valueInr);
      // A check with no priced options says nothing about value; an older
      // check of the same card may, so don't mark the card as seen.
      if (valued.length === 0) continue;
      seen.add(key);

      const best = valued[0];
      const worst = valued[valued.length - 1];
      snapshots.push({
        cardName: r.cardName,
        points: r.points,
        checkedAt: new Date(r.createdAt).toISOString(),
        best,
        worst: worst.valueInr < best.valueInr * 0.9 ? worst : null,
      });
    }

    snapshots.sort((a, b) => b.best.valueInr - a.best.valueInr);
    return ApiResponse.success("ok", 200, { cards: snapshots.slice(0, MAX_CARDS) });
  } catch (err) {
    console.error("[/api/redemption/latest] failed", err);
    return ApiResponse.error("Couldn't load points", 500);
  }
}
