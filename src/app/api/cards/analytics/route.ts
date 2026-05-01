import { NextResponse } from "next/server";
import { Types } from "mongoose";
import SpendTransaction from "@/models/SpendTransaction";
import dbConnect from "@/lib/utils/dbConnet";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";

export async function GET() {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session?.user?._id;
  const uid = new Types.ObjectId(userId);

  const topCards = await SpendTransaction.aggregate([
    { $match: { userId: uid } },

    // Unwind cards array to get one doc per card per transaction
    { $unwind: "$cards" },

    // Keep only the best card for each transaction
    { $match: { "cards.isBestCard": true } },

    // Compute reward as max of directSwipe and voucher savings
    {
      $addFields: {
        rewardValue: {
          $max: [
            { $ifNull: ["$cards.directSwipeSavingsInInr", 0] },
            { $ifNull: ["$cards.voucherSavingsInInr", 0] },
          ],
        },
        normalizedCardName: {
          $trim: {
            input: {
              $toLower: {
                $replaceAll: {
                  input: {
                    $replaceAll: {
                      input: "$cards.cardName",
                      find: "*",
                      replacement: "",
                    },
                  },
                  find: "  ",
                  replacement: " ",
                },
              },
            },
          },
        },
      },
    },

    // Filter out empty card names
    { $match: { normalizedCardName: { $nin: [null, ""] } } },

    // Group by card name
    {
      $group: {
        _id: "$normalizedCardName",
        cardName: { $first: "$cards.cardName" },
        cardSpend: { $sum: "$amount" },
        cardRewards: { $sum: "$rewardValue" },
      },
    },

    // Compute spend-reward ratio
    {
      $addFields: {
        spendRewardRatio: {
          $cond: [
            { $gt: ["$cardSpend", 0] },
            { $divide: ["$cardRewards", "$cardSpend"] },
            0,
          ],
        },
      },
    },

    { $sort: { spendRewardRatio: -1 } },
    { $limit: 2 },

    {
      $project: {
        _id: 0,
        cardKey: "$_id",
        cardName: 1,
        cardSpend: 1,
        cardRewards: 1,
        spendRewardRatio: 1,
      },
    },
  ]);

  const [spendAnalytics] = await SpendTransaction.aggregate([
    { $match: { userId: uid } },
    { $unwind: "$cards" },
    { $match: { "cards.isBestCard": true } },
    {
      $addFields: {
        rewardValue: {
          $max: [
            { $ifNull: ["$cards.directSwipeSavingsInInr", 0] },
            { $ifNull: ["$cards.voucherSavingsInInr", 0] },
          ],
        },
      },
    },
    {
      $group: {
        _id: null,
        totalAmountSpent: { $sum: "$amount" },
        totalRewardsEarned: { $sum: "$rewardValue" },
        totalSpendOptimized: { $sum: 1 },
      },
    },
  ]);

  return NextResponse.json({
    topCards,
    spendAnalytics,
  });
}
