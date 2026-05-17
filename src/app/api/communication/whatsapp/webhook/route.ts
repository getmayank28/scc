import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/utils/dbConnet";
import WhatsAppMessage, { WhatsAppStatus } from "@/models/WhatsAppMessage";

// Gupshup webhook receiver.
// Configure this URL in the Gupshup dashboard:
//   https://<host>/api/communication/whatsapp/webhook
// Optional: set GUPSHUP_WEBHOOK_SECRET and configure the same value as a
// custom header (e.g. `x-gupshup-secret`) in the Gupshup callback settings.

export const dynamic = "force-dynamic";

const AUTO_REPLY_TEMPLATE_ID = "5da9a967-c168-42f7-8d92-7a48992363d1";

const KNOWN_STATUSES = new Set<WhatsAppStatus>([
  "enqueued",
  "sent",
  "delivered",
  "read",
  "failed",
  "received",
  "deleted",
  "other",
]);

function normalizeStatus(value: unknown): WhatsAppStatus {
  if (typeof value !== "string") return "other";
  const v = value.toLowerCase();
  if (KNOWN_STATUSES.has(v as WhatsAppStatus)) return v as WhatsAppStatus;
  return "other";
}

function toDate(ts: unknown): Date | undefined {
  if (ts == null) return undefined;
  const n = typeof ts === "string" ? Number(ts) : (ts as number);
  if (!Number.isFinite(n)) return undefined;
  // Gupshup sends ms-epoch
  return new Date(n);
}

function extractText(
  payload: Record<string, unknown> | undefined,
): string | undefined {
  if (!payload) return undefined;
  const inner = payload.payload as Record<string, unknown> | undefined;
  if (inner && typeof inner.text === "string") return inner.text as string;
  if (typeof payload.text === "string") return payload.text as string;
  return undefined;
}

function verifySecret(req: NextRequest): boolean {
  const expected = process.env.GUPSHUP_WEBHOOK_SECRET;
  if (!expected) return true; // not configured — accept
  const provided =
    req.headers.get("x-gupshup-secret") ??
    req.headers.get("x-webhook-secret") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return provided === expected;
}

type GupshupPayload = {
  app?: string;
  timestamp?: number | string;
  version?: number;
  type?: string; // "message-event" | "message" | "user-event" | ...
  payload?: {
    id?: string;
    gsId?: string;
    type?: string; // "sent" | "delivered" | "read" | "failed" | "text" | ...
    destination?: string;
    source?: string;
    payload?: Record<string, unknown>;
    sender?: { phone?: string; name?: string };
    reason?: string;
    code?: string | number;
  };
};

async function handleMessageEvent(body: GupshupPayload) {
  const p = body.payload ?? {};
  const gsId = p.gsId ?? p.id;
  if (!gsId) return;

  const status = normalizeStatus(p.type);
  const providerTimestamp = toDate(body.timestamp);
  // Gupshup nests error details inside payload.payload for failed events,
  // but older/other event shapes put them at payload.code / payload.reason.
  const inner = p.payload as Record<string, unknown> | undefined;
  const rawCode = inner?.code ?? p.code;
  const rawReason = inner?.reason ?? p.reason;
  const errorCode = rawCode != null ? String(rawCode) : undefined;
  const errorReason =
    typeof rawReason === "string" ? rawReason : undefined;

  const historyEntry = {
    status,
    at: providerTimestamp ?? new Date(),
    code: errorCode,
    reason: errorReason,
  };

  await WhatsAppMessage.findOneAndUpdate(
    { gsId },
    {
      $setOnInsert: {
        gsId,
        direction: "outbound",
        destination: p.destination,
        source: p.source,
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
}

async function sendAutoReplyTemplate(
  destination: string,
  templateId: string,
  templateParams: string[],
) {
  const params = new URLSearchParams({
    source: process.env.GUPSHUP_SOURCE_NUMBER!,
    destination,
    "src.name": process.env.GUPSHUP_APP_NAME!,
    template: JSON.stringify({ id: templateId, params: templateParams }),
  });

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
    /* non-JSON response — keep raw text */
  }

  const now = new Date();
  if (res.ok && data.messageId) {
    await WhatsAppMessage.create({
      gsId: data.messageId as string,
      direction: "outbound",
      status: "enqueued",
      source: process.env.GUPSHUP_SOURCE_NUMBER!,
      destination,
      messageType: "template",
      templateId,
      statusHistory: [{ status: "enqueued", at: now }],
      raw: data,
    });
  } else {
    const errorCode = data.statusCode as string | undefined;
    const errorReason = (data.details ?? data.message) as string | undefined;
    await WhatsAppMessage.create({
      direction: "outbound",
      status: "failed",
      source: process.env.GUPSHUP_SOURCE_NUMBER!,
      destination,
      messageType: "template",
      templateId,
      errorCode,
      errorReason,
      statusHistory: [
        { status: "failed", at: now, code: errorCode, reason: errorReason },
      ],
      raw: Object.keys(data).length ? data : text,
    });
  }
}

async function handleInboundMessage(body: GupshupPayload) {
  const p = body.payload ?? {};
  const externalId = p.id ?? p.gsId;
  const senderPhone = p.sender?.phone ?? p.source;
  const senderName = p.sender?.name;

  await WhatsAppMessage.create({
    externalId,
    direction: "inbound",
    status: "received",
    source: p.destination, // business number (receiver)
    destination: p.destination,
    senderPhone,
    senderName,
    messageType: p.type,
    text: extractText(p),
    providerTimestamp: toDate(body.timestamp),
    statusHistory: [
      { status: "received", at: toDate(body.timestamp) ?? new Date() },
    ],
    raw: body,
  });

  // Gupshup delivers the inbound webhook to every configured callback URL
  // (prod and stage), so guard the auto-reply to a single environment to
  // avoid sending the template twice to the same sender.
  if (senderPhone && process.env.VERCEL_ENV === "production") {
    try {
      const firstName = senderName?.trim().split(/\s+/)[0] || "there";
      await sendAutoReplyTemplate(senderPhone, AUTO_REPLY_TEMPLATE_ID, [
        firstName,
      ]);
    } catch (err) {
      console.error("[whatsapp-webhook] auto-reply failed:", err);
    }
  }
}

export async function POST(req: NextRequest) {
  const isAllowed = verifySecret(req);
  if (!isAllowed) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let body: GupshupPayload;
  try {
    body = (await req.json()) as GupshupPayload;
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  try {
    await dbConnect();

    switch (body.type) {
      case "message-event":
      case "msg-event":
        await handleMessageEvent(body);
        break;
      case "message":
        await handleInboundMessage(body);
        break;
      default:
        // user-event, template-event, billing-event, account-event, etc.
        // Persist minimally for audit without failing the ack.
        await WhatsAppMessage.create({
          direction: "outbound",
          status: "other",
          messageType: body.type ?? "unknown",
          providerTimestamp: toDate(body.timestamp),
          raw: body,
          statusHistory: [
            { status: "other", at: toDate(body.timestamp) ?? new Date() },
          ],
        });
        break;
    }
  } catch (error) {
    console.error("[whatsapp-webhook] error:", error);
    // Still 200 so Gupshup doesn't hammer retries on transient DB issues —
    // surface via logs instead.
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

export async function GET() {
  // Gupshup sometimes pings via GET during setup verification.
  return NextResponse.json({ ok: true });
}
