import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/utils/dbConnet";
import { Waitlist } from "@/models/Waitlist";
import EmailMessage from "@/models/EmailMessage";
import { resend } from "@/lib/utils/resend";
import { getEmailTemplate } from "@/lib/utils/emailTemplates";

/**
 * POST /api/communication/email/campaign
 *
 * Sends templated emails to waitlist users in batches.
 * Each batch can use a different template.
 *
 * Body:
 * {
 *   batches: [
 *     { templateId: "fisense_launch_email", limit: 200 },
 *     { templateId: "other_template", limit: 100, excludeIfSentTemplateIds: ["fisense_launch_email"] },
 *   ]
 * }
 *
 * Fetches waitlist users who have an email, skips users already successfully
 * sent the same template (or any template in `excludeIfSentTemplateIds`), and
 * skips users assigned to an earlier batch in the same request. Users whose
 * previous send failed for either the current or excluded template are
 * retried in this run.
 */

type BatchConfig = {
  templateId: string;
  limit: number;
  excludeIfSentTemplateIds?: string[];
};

type SendResult = {
  recipient: string;
  templateId: string;
  batch: number;
  providerId?: string;
  status: "sent" | "failed";
  error?: string;
};

const FROM = "Fisense <support@gofisense.com>";

async function sendTemplatedEmail(
  recipient: string,
  templateId: string,
  firstName: string,
): Promise<{
  providerId?: string;
  status: "sent" | "failed";
  error?: string;
  raw?: unknown;
}> {
  const template = getEmailTemplate(templateId);
  if (!template) {
    return { status: "failed", error: `Unknown templateId: ${templateId}` };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: [recipient],
      subject: template.subject({ firstName }),
      html: template.html({ firstName }),
    });

    if (error || !data?.id) {
      return {
        status: "failed",
        error: error?.message ?? "unknown error",
        raw: error ?? data,
      };
    }

    return { providerId: data.id, status: "sent", raw: data };
  } catch (err) {
    return {
      status: "failed",
      error: err instanceof Error ? err.message : String(err),
    };
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

    for (const b of batches) {
      if (!getEmailTemplate(b.templateId)) {
        return NextResponse.json(
          { message: `Unknown templateId: ${b.templateId}` },
          { status: 400 },
        );
      }
    }

    await dbConnect();

    const waitlistUsers = await Waitlist.find({
      email: { $exists: true, $nin: [null, ""] },
    })
      .sort({ createdAt: 1 })
      .lean();

    if (waitlistUsers.length === 0) {
      return NextResponse.json(
        { message: "No waitlist users with emails found" },
        { status: 404 },
      );
    }

    const normalizedUsers = waitlistUsers.map((u) => ({
      ...u,
      emailLower: String(u.email).trim().toLowerCase(),
    }));

    const results: SendResult[] = [];
    const allEmails = normalizedUsers.map((u) => u.emailLower);
    const assignedInThisRun = new Set<string>();

    for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
      const batch = batches[batchIdx];

      const excludeTemplateIds = Array.from(
        new Set([batch.templateId, ...(batch.excludeIfSentTemplateIds ?? [])]),
      );

      // Only successful prior sends disqualify a user; previously failed sends
      // are retried in this run.
      const alreadySentDocs = await EmailMessage.find({
        direction: "outbound",
        templateId: { $in: excludeTemplateIds },
        recipient: { $in: allEmails },
        status: { $ne: "failed" },
      })
        .select("recipient")
        .lean();

      const alreadySentSet = new Set(alreadySentDocs.map((d) => d.recipient));
      const batchUsers = normalizedUsers
        .filter(
          (u) =>
            !alreadySentSet.has(u.emailLower) &&
            !assignedInThisRun.has(u.emailLower),
        )
        .slice(0, batch.limit);

      for (const user of batchUsers) {
        assignedInThisRun.add(user.emailLower);
        const firstName =
          (user.fullName as string | undefined)?.trim().split(/\s+/)[0] ||
          "there";

        const result = await sendTemplatedEmail(
          user.emailLower,
          batch.templateId,
          firstName,
        );

        const now = new Date();
        const template = getEmailTemplate(batch.templateId)!;
        const subject = template.subject({ firstName });

        if (result.status === "sent" && result.providerId) {
          await EmailMessage.create({
            providerId: result.providerId,
            direction: "outbound",
            status: "sent",
            from: FROM,
            recipient: user.emailLower,
            subject,
            templateId: batch.templateId,
            statusHistory: [{ status: "sent", at: now }],
            raw: result.raw,
          });
        } else {
          await EmailMessage.create({
            direction: "outbound",
            status: "failed",
            from: FROM,
            recipient: user.emailLower,
            subject,
            templateId: batch.templateId,
            errorReason: result.error,
            statusHistory: [
              { status: "failed", at: now, reason: result.error },
            ],
            raw: result.raw ?? result.error,
          });
        }

        results.push({
          recipient: user.emailLower,
          templateId: batch.templateId,
          batch: batchIdx + 1,
          providerId: result.providerId,
          status: result.status,
          error: result.error,
        });

        await new Promise((r) => setTimeout(r, 300));
      }
    }

    const summary = {
      totalWaitlistUsers: waitlistUsers.length,
      totalEmailsSent: results.filter((r) => r.status === "sent").length,
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
    console.error("[email-campaign] error:", error);
    return NextResponse.json({ message: "Campaign failed" }, { status: 500 });
  }
}
