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
    // 1️⃣ Match user
    {
      $match: { userId: uid },
    },

    // 2️⃣ Extract rewardValue (₹ only)
    {
      $addFields: {
        rewardValue: {
          $cond: [
            {
              $regexMatch: {
                input: { $ifNull: ["$expectedBenefit", ""] },
                regex: /(\d+(\.\d+)?)/, // contains a number
              },
            },
            {
              $toDouble: {
                $trim: {
                  input: {
                    $replaceAll: {
                      input: {
                        $replaceAll: {
                          input: {
                            $replaceAll: {
                              input: "$expectedBenefit",
                              find: "₹",
                              replacement: "",
                            },
                          },
                          find: "INR",
                          replacement: "",
                        },
                      },
                      find: ",",
                      replacement: "",
                    },
                  },
                },
              },
            },
            0,
          ],
        },
      },
    },

    // 3️⃣ Normalize card name (remove **, lowercase, trim)
    {
      $addFields: {
        normalizedCardName: {
          $trim: {
            input: {
              $toLower: {
                $replaceAll: {
                  input: {
                    $replaceAll: {
                      input: "$cardName",
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

    // 4️⃣ Group by normalized card name
    {
      $group: {
        _id: "$normalizedCardName",
        cardName: { $first: "$cardName" }, // display name
        cardSpend: { $sum: "$amount" },
        cardRewards: { $sum: "$rewardValue" },
      },
    },

    // 6️⃣ Top 2 cards
    { $sort: { spendRewardRatio: -1 } },
    { $limit: 2 },

    // 7️⃣ Clean response
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
    {
      $match: { userId: uid },
    },
    {
      $addFields: {
        rewardValue: {
          $cond: [
            {
              $regexMatch: {
                input: { $ifNull: ["$expectedBenefit", ""] },
                regex: /(\d+(\.\d+)?)/, // contains a number
              },
            },
            {
              $toDouble: {
                $trim: {
                  input: {
                    $replaceAll: {
                      input: {
                        $replaceAll: {
                          input: {
                            $replaceAll: {
                              input: "$expectedBenefit",
                              find: "₹",
                              replacement: "",
                            },
                          },
                          find: "INR",
                          replacement: "",
                        },
                      },
                      find: ",",
                      replacement: "",
                    },
                  },
                },
              },
            },
            0,
          ],
        },
      },
    },
    {
      $group: {
        _id: null,
        totalAmountSpent: { $sum: "$amount" },
        totalRewardsEarned: { $sum: "$rewardValue" },
        totalSpendOptimized: { $sum: 1 }, // ✅ COUNT
      },
    },
  ]);

  return NextResponse.json({
    topCards,
    spendAnalytics,
  });
}
