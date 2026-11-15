import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import { ApiResponse } from "@/lib/utils/ApiResponse";
import dbConnect from "@/lib/utils/dbConnet";
import UserCardModel from "@/models/UserCard";
import "@/models/Card";
import { buildWalletCheatSheet, EXAMPLE_CARD_SLUG } from "@/lib/advisor/walletCheatSheet";

export const runtime = "nodejs";

interface PopulatedUserCard {
  cardId?: { slug?: string } | null;
}

/**
 * Home cheat sheet: for each everyday spend, which card in the user's wallet
 * earns the most. Empty `cards`/`rows` when the wallet is empty or nothing
 * resolves.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?._id;
  if (!userId) return ApiResponse.error("Unauthorized", 401);

  try {
    await dbConnect();

    const owned = await UserCardModel.find({ userId })
      .populate("cardId", "slug")
      .lean<PopulatedUserCard[]>();

    const slugs = [
      ...new Set(
        owned
          .map((u) => u.cardId?.slug)
          .filter((s): s is string => typeof s === "string" && s.length > 0),
      ),
    ];

    const sheet =
      slugs.length > 0
        ? await buildWalletCheatSheet(slugs)
        : { cards: [], rows: [] };

    // Nothing of their own to show: send the example in the same response, so
    // the page can draw its final layout at once instead of waiting on a
    // second request and shifting when it lands. Failure here is cosmetic.
    const example =
      sheet.cards.length === 0
        ? await buildWalletCheatSheet([EXAMPLE_CARD_SLUG]).catch(() => null)
        : null;

    return ApiResponse.success("ok", 200, {
      walletCardCount: slugs.length,
      ...sheet,
      example,
    });
  } catch (err) {
    console.error("[/api/home/cheat-sheet] failed:", err);
    return ApiResponse.error("Cheat sheet failed", 500);
  }
}
