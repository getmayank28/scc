import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/utils/dbConnet";
import EmailMessage from "@/models/EmailMessage";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/email?page=1&limit=50&status=delivered&templateId=...
 *
 * Returns outbound email messages for the admin dashboard.
 */
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = req.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      200,
      Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)),
    );
    const skip = (page - 1) * limit;
    const status = searchParams.get("status") ?? undefined;
    const templateId = searchParams.get("templateId") ?? undefined;

    const filter: Record<string, unknown> = { direction: "outbound" };
    if (status) filter.status = status;
    if (templateId) filter.templateId = templateId;

    const [messages, total] = await Promise.all([
      EmailMessage.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      EmailMessage.countDocuments(filter),
    ]);

    const data = messages.map((m) => ({
      _id: m._id,
      recipient: m.recipient ?? "",
      subject: m.subject ?? "",
      status: m.status,
      templateId: m.templateId ?? "",
      providerId: m.providerId ?? "",
      errorCode: m.errorCode,
      errorReason: m.errorReason,
      createdAt: m.createdAt,
      providerTimestamp: m.providerTimestamp,
    }));

    return NextResponse.json({
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data,
    });
  } catch (error) {
    console.error("[admin-email] error:", error);
    return NextResponse.json(
      { message: "Failed to fetch emails" },
      { status: 500 },
    );
  }
}
