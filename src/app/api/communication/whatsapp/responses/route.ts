import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/utils/dbConnet";
import WhatsAppMessage from "@/models/WhatsAppMessage";

/**
 * GET /api/communication/whatsapp/responses
 *
 * Query who responded to your WhatsApp messages.
 *
 * Query params:
 *   - type: "replies" | "delivery" (default: "replies")
 *       "replies"  — inbound messages from users (people who actually texted back)
 *       "delivery" — outbound message delivery statuses
 *   - status: filter by status (e.g., "delivered", "read", "failed") — for delivery type
 *   - since: ISO date string to filter messages after this date
 *   - page: page number (default: 1)
 *   - limit: results per page (default: 50, max: 200)
 */

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = req.nextUrl;
    const type = searchParams.get("type") ?? "replies";
    const status = searchParams.get("status");
    const since = searchParams.get("since");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      200,
      Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)),
    );
    const skip = (page - 1) * limit;

    if (type === "replies") {
      // Find all inbound messages (people who replied)
      const filter: Record<string, unknown> = {
        direction: "inbound",
        status: "received",
      };
      if (since) filter.createdAt = { $gte: new Date(since) };

      const [replies, total] = await Promise.all([
        WhatsAppMessage.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .select("senderPhone senderName text createdAt providerTimestamp")
          .lean(),
        WhatsAppMessage.countDocuments(filter),
      ]);

      return NextResponse.json({
        type: "replies",
        total,
        page,
        totalPages: Math.ceil(total / limit),
        data: replies,
      });
    }

    if (type === "delivery") {
      // Show delivery status of outbound messages
      const filter: Record<string, unknown> = { direction: "outbound" };
      if (status) filter.status = status;
      if (since) filter.createdAt = { $gte: new Date(since) };

      const [messages, total, statusCounts] = await Promise.all([
        WhatsAppMessage.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .select(
            "destination status statusHistory messageType errorCode errorReason createdAt",
          )
          .lean(),
        WhatsAppMessage.countDocuments(filter),
        WhatsAppMessage.aggregate([
          { $match: { direction: "outbound", ...(since ? { createdAt: { $gte: new Date(since) } } : {}) } },
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
      ]);

      const summary = Object.fromEntries(
        statusCounts.map((s) => [s._id, s.count]),
      );

      return NextResponse.json({
        type: "delivery",
        total,
        page,
        totalPages: Math.ceil(total / limit),
        summary,
        data: messages,
      });
    }

    return NextResponse.json(
      { message: 'Invalid type. Use "replies" or "delivery".' },
      { status: 400 },
    );
  } catch (error) {
    console.error("[whatsapp-responses] error:", error);
    return NextResponse.json(
      { message: "Failed to fetch responses" },
      { status: 500 },
    );
  }
}
