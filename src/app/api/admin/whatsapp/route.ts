import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/utils/dbConnet";
import WhatsAppMessage from "@/models/WhatsAppMessage";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/whatsapp?direction=outbound|inbound&page=1&limit=50
 *
 * Returns WhatsApp messages for the admin dashboard.
 */
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = req.nextUrl;
    const direction = searchParams.get("direction") ?? "outbound";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      200,
      Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)),
    );
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { direction };

    // For inbound, only show actual user replies — exclude system events
    if (direction === "inbound") {
      filter.status = { $ne: "other" };
    }

    const [messages, total] = await Promise.all([
      WhatsAppMessage.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      WhatsAppMessage.countDocuments(filter),
    ]);

    const data = messages.map((m) => {
      const phone =
        direction === "outbound" ? m.destination : m.senderPhone;

      return {
        _id: m._id,
        phone: phone ?? "",
        direction: m.direction,
        status: m.status,
        templateId: m.templateId ?? "",
        messageType: m.messageType ?? "",
        text: m.text ?? "",
        errorCode: m.errorCode,
        errorReason: m.errorReason,
        createdAt: m.createdAt,
      };
    });

    return NextResponse.json({
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data,
    });
  } catch (error) {
    console.error("[admin-whatsapp] error:", error);
    return NextResponse.json(
      { message: "Failed to fetch messages" },
      { status: 500 },
    );
  }
}
