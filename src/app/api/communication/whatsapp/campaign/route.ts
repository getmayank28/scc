import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/utils/dbConnet";
import { Waitlist } from "@/models/Waitlist";
import WhatsAppMessage from "@/models/WhatsAppMessage";

/**
 * POST /api/communication/whatsapp/campaign
 *
 * Sends WhatsApp template messages to waitlist users in batches.
 * Each batch can use a different template.
 *
 * Body:
 * {
 *   batches: [
 *     { templateId: "uuid-a", limit: 150 },
 *     { templateId: "uuid-b", limit: 100 },
 *   ]
 * }
 *
 * The endpoint fetches waitlist users who have a mobile number,
 * skips users who were already sent a message in this campaign (to avoid duplicates),
 * and assigns them to batches in order until each batch's limit is filled.
 *
 * The template is passed the user's first name (derived from fullName) as the
 * only param, falling back to "there" when fullName is missing.
 */

type BatchConfig = {
  templateId: string;
  limit: number;
};

type SendResult = {
  destination: string;
  templateId: string;
  batch: number;
  messageId?: string;
  status: string;
  error?: string;
};

async function sendTemplate(
  destination: string,
  templateId: string,
  templateParams: string[],
): Promise<{ messageId?: string; status: string; error?: string }> {
  const params = new URLSearchParams({
    source: process.env.GUPSHUP_SOURCE_NUMBER!,
    destination,
    "src.name": process.env.GUPSHUP_APP_NAME!,
    template: JSON.stringify({
      id: templateId,
      params: templateParams,
    }),
  });

  try {
    const res = await fetch("https://api.gupshup.io/wa/api/v1/template/msg", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        apikey: process.env.GUPSHUP_API_KEY!,
      },
      body: params.toString(),
    });

    const text = await res.text();
    let data: Record<string, unknown> = {};
    try {
      data = JSON.parse(text);
    } catch {
      return { status: "failed", error: text };
    }
    return {
      messageId: data.messageId as string | undefined,
      status: res.ok ? "sent" : "failed",
      error: res.ok ? undefined : text,
    };
  } catch (err) {
    return { status: "failed", error: String(err) };
  }
}

export async function POST(req: NextRequest) {
  try {
    const { batches } = (await req.json()) as { batches: BatchConfig[] };

    if (!batches || !Array.isArray(batches) || batches.length === 0) {
      return NextResponse.json(
        { message: "batches array is required" },
        { status: 400 },
      );
    }

    await dbConnect();

    // Fetch waitlist users that have a mobile number
    const waitlistUsers = await Waitlist.find({
      mobile: { $exists: true, $nin: [null, ""] },
    })
      .sort({ createdAt: 1 })
      .lean();

    if (waitlistUsers.length === 0) {
      return NextResponse.json(
        { message: "No waitlist users with mobile numbers found" },
        { status: 404 },
      );
    }

    // Normalize mobile numbers to include country code if missing
    const allNormalizedUsers = waitlistUsers.map((u) => ({
      ...u,
      phone: u.mobile.replace(/^\+/, "").startsWith("91")
        ? u.mobile.replace(/^\+/, "")
        : `91${u.mobile.replace(/^\+/, "")}`,
    }));

    // Split users into batches, skipping users who already received that specific template
    const results: SendResult[] = [];
    const allPhones = allNormalizedUsers.map((u) => u.phone);

    for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
      const batch = batches[batchIdx];

      // Find numbers that already received this template
      const alreadySentDocs = await WhatsAppMessage.find({
        direction: "outbound",
        templateId: batch.templateId,
        destination: { $in: allPhones },
      })
        .select("destination")
        .lean();

      const alreadySentSet = new Set(alreadySentDocs.map((d) => d.destination));
      const batchUsers = allNormalizedUsers
        .filter((u) => !alreadySentSet.has(u.phone))
        .slice(0, batch.limit);

      for (const user of batchUsers) {
        const firstName = user.fullName?.trim().split(/\s+/)[0] || "there";
        const result = await sendTemplate(user.phone, batch.templateId, [
          firstName,
        ]);

        if (result.messageId) {
          await WhatsAppMessage.create({
            gsId: result.messageId,
            direction: "outbound",
            status: "enqueued",
            source: process.env.GUPSHUP_SOURCE_NUMBER!,
            destination: user.phone,
            messageType: "template",
            templateId: batch.templateId,
            statusHistory: [{ status: "enqueued", at: new Date() }],
          });
        }

        results.push({
          destination: user.phone,
          templateId: batch.templateId,
          batch: batchIdx + 1,
          messageId: result.messageId,
          status: result.status,
          error: result.error,
        });

        await new Promise((r) => setTimeout(r, 300));
      }
    }

    const summary = {
      totalWaitlistUsers: waitlistUsers.length,
      totalMessagesSent: results.filter((r) => r.status === "sent").length,
      totalFailed: results.filter((r) => r.status === "failed").length,
      batchBreakdown: batches.map((b, i) => ({
        batch: i + 1,
        templateId: b.templateId,
        requested: b.limit,
        sent: results.filter((r) => r.batch === i + 1 && r.status === "sent")
          .length,
        failed: results.filter(
          (r) => r.batch === i + 1 && r.status === "failed",
        ).length,
      })),
    };

    return NextResponse.json({ summary, results });
  } catch (error) {
    console.error("[whatsapp-campaign] error:", error);
    return NextResponse.json({ message: "Campaign failed" }, { status: 500 });
  }
}
