import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import dbConnect from "@/lib/utils/dbConnet";
import EmailMessage, { EmailStatus } from "@/models/EmailMessage";

// Resend webhook receiver.
// Configure this URL in the Resend dashboard:
//   https://<host>/api/communication/email/webhook
// Resend signs payloads via Svix. Set RESEND_WEBHOOK_SECRET to the value
// shown in the Resend dashboard (starts with "whsec_") to enable
// verification. If unset, the endpoint accepts payloads without checking.

export const dynamic = "force-dynamic";

const RESEND_TYPE_TO_STATUS: Record<string, EmailStatus> = {
  "email.sent": "sent",
  "email.delivered": "delivered",
  "email.delivery_delayed": "sent",
  "email.opened": "opened",
  "email.clicked": "clicked",
  "email.bounced": "bounced",
  "email.complained": "complained",
  "email.failed": "failed",
};

function mapStatus(type: string | undefined): EmailStatus {
  if (!type) return "other";
  return RESEND_TYPE_TO_STATUS[type] ?? "other";
}

function toDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    return isNaN(d.getTime()) ? undefined : d;
  }
  return undefined;
}

// Svix signature verification — Resend uses the Svix format
// (https://docs.svix.com/receiving/verifying-payloads/how-manual).
function verifySvixSignature(
  secret: string,
  msgId: string,
  msgTimestamp: string,
  msgSignature: string,
  rawBody: string,
): boolean {
  const secretBytes = secret.startsWith("whsec_")
    ? Buffer.from(secret.slice("whsec_".length), "base64")
    : Buffer.from(secret, "utf8");

  const signed = `${msgId}.${msgTimestamp}.${rawBody}`;
  const expected = crypto
    .createHmac("sha256", secretBytes)
    .update(signed)
    .digest("base64");

  // svix-signature is a space-separated list of "v1,<base64>" entries
  return msgSignature
    .split(" ")
    .map((part) => part.split(",")[1])
    .filter(Boolean)
    .some((sig) => {
      try {
        return crypto.timingSafeEqual(
          Buffer.from(sig),
          Buffer.from(expected),
        );
      } catch {
        return false;
      }
    });
}

type ResendWebhookBody = {
  type?: string;
  created_at?: string;
  data?: {
    email_id?: string;
    id?: string;
    from?: string;
    to?: string[] | string;
    subject?: string;
    bounce?: { type?: string; subType?: string; message?: string };
    click?: { link?: string };
  };
};

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (secret) {
    const id = req.headers.get("svix-id");
    const ts = req.headers.get("svix-timestamp");
    const sig = req.headers.get("svix-signature");
    if (!id || !ts || !sig) {
      return NextResponse.json(
        { message: "Missing svix headers" },
        { status: 401 },
      );
    }
    if (!verifySvixSignature(secret, id, ts, sig, rawBody)) {
      return NextResponse.json(
        { message: "Invalid signature" },
        { status: 401 },
      );
    }
  }

  let body: ResendWebhookBody;
  try {
    body = JSON.parse(rawBody) as ResendWebhookBody;
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  try {
    await dbConnect();

    const data = body.data ?? {};
    const providerId = data.email_id ?? data.id;
    if (!providerId) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const status = mapStatus(body.type);
    const providerTimestamp = toDate(body.created_at);
    const recipient = Array.isArray(data.to)
      ? data.to[0]?.toLowerCase()
      : typeof data.to === "string"
        ? data.to.toLowerCase()
        : undefined;

    let errorReason: string | undefined;
    let errorCode: string | undefined;
    if (status === "bounced" && data.bounce) {
      errorReason = data.bounce.message ?? data.bounce.subType;
      errorCode = data.bounce.type;
    } else if (status === "failed") {
      errorReason = "Send failed";
    }

    const historyEntry = {
      status,
      at: providerTimestamp ?? new Date(),
      code: errorCode,
      reason: errorReason,
    };

    await EmailMessage.findOneAndUpdate(
      { providerId },
      {
        $setOnInsert: {
          providerId,
          direction: "outbound",
          recipient,
          from: data.from,
          subject: data.subject,
        },
        $set: {
          status,
          errorCode,
          errorReason,
          providerTimestamp,
          raw: body,
        },
        $push: { statusHistory: historyEntry },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("[email-webhook] error:", error);
    // Return 200 to prevent excessive retry storms — surface errors via logs.
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
