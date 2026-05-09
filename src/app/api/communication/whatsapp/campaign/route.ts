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
 *     { templateId: "uuid-b", limit: 100, excludeIfSentTemplateIds: ["uuid-a"] },
 *   ]
 * }
 *
 * The endpoint fetches waitlist users who have a mobile number,
 * skips users who were already sent the same template (to avoid duplicates),
 * additionally skips users who previously received any template listed in
 * `excludeIfSentTemplateIds`, and skips users already assigned to an earlier
 * batch in the same request. Users are then assigned to batches in order
 * until each batch's limit is filled.
 *
 * The template is passed the user's first name (derived from fullName) as the
 * only param, falling back to "there" when fullName is missing.
 */

type BatchConfig = {
  templateId: string;
  limit: number;
  excludeIfSentTemplateIds?: string[];
};

type SendResult = {
  destination: string;
  templateId: string;
  batch: number;
  messageId?: string;
  status: string;
  errorCode?: string;
  errorReason?: string;
  error?: string;
};

type SendTemplateResult = {
  messageId?: string;
  status: "sent" | "failed";
  errorCode?: string;
  errorReason?: string;
  raw?: unknown;
  error?: string;
};

async function sendTemplate(
  destination: string,
  templateId: string,
  templateParams: string[],
): Promise<SendTemplateResult> {
  const params = new URLSearchParams({
    source: "917567601600",
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
      return { status: "failed", error: text, raw: text };
    }

    if (res.ok) {
      return {
        messageId: data.messageId as string | undefined,
        status: "sent",
        raw: data,
      };
    }

    return {
      status: "failed",
      errorCode: data.statusCode as string | undefined,
      errorReason: (data.details ?? data.message) as string | undefined,
      error: text,
      raw: data,
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

    // Split users into batches, skipping users who already received that specific template,
    // any template the batch wants to exclude, or who were already assigned earlier in this run.
    const results: SendResult[] = [];
    const allPhones = allNormalizedUsers.map((u) => u.phone);
    const assignedInThisRun = new Set<string>();

    for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
      const batch = batches[batchIdx];

      const excludeTemplateIds = Array.from(
        new Set([batch.templateId, ...(batch.excludeIfSentTemplateIds ?? [])]),
      );

      const alreadySentDocs = await WhatsAppMessage.find({
        direction: "outbound",
        templateId: { $in: excludeTemplateIds },
        destination: { $in: allPhones },
        status: { $ne: "failed" },
      })
        .select("destination")
        .lean();

      const alreadySentSet = new Set(alreadySentDocs.map((d) => d.destination));
      const batchUsers = allNormalizedUsers
        .filter(
          (u) =>
            !alreadySentSet.has(u.phone) && !assignedInThisRun.has(u.phone),
        )
        .slice(0, batch.limit);

      for (const user of batchUsers) {
        assignedInThisRun.add(user.phone);
        const firstName = user.fullName?.trim().split(/\s+/)[0] || "there";
        const result = await sendTemplate(user.phone, batch.templateId, [
          firstName,
        ]);

        const now = new Date();
        if (result.status === "sent" && result.messageId) {
          await WhatsAppMessage.create({
            gsId: result.messageId,
            direction: "outbound",
            status: "enqueued",
            source: process.env.GUPSHUP_SOURCE_NUMBER!,
            destination: user.phone,
            messageType: "template",
            templateId: batch.templateId,
            statusHistory: [{ status: "enqueued", at: now }],
            raw: result.raw,
          });
        } else if (result.status === "failed") {
          await WhatsAppMessage.create({
            direction: "outbound",
            status: "failed",
            source: process.env.GUPSHUP_SOURCE_NUMBER!,
            destination: user.phone,
            messageType: "template",
            templateId: batch.templateId,
            errorCode: result.errorCode,
            errorReason: result.errorReason,
            statusHistory: [
              {
                status: "failed",
                at: now,
                code: result.errorCode,
                reason: result.errorReason,
              },
            ],
            raw: result.raw ?? result.error,
          });
        }

        results.push({
          destination: user.phone,
          templateId: batch.templateId,
          batch: batchIdx + 1,
          messageId: result.messageId,
          status: result.status,
          errorCode: result.errorCode,
          errorReason: result.errorReason,
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
