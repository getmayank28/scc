import type { Types } from "mongoose";
import WhatsAppMessage, { type IWhatsAppMessage } from "@/models/WhatsAppMessage";

/**
 * The one Gupshup template sender. Every template message goes through here
 * and is logged as a `WhatsAppMessage`, which the Gupshup webhook then moves
 * through sent → delivered → read / failed by `gsId`.
 *
 * Consent is the caller's job (see lib/campaign/notify.ts): OTPs need none,
 * claim updates need `informationConsent`.
 */

const GUPSHUP_TEMPLATE_URL = "https://api.gupshup.io/wa/api/v1/template/msg";

export interface SendTemplateArgs {
  /** 10-digit Indian number, or already prefixed with 91. */
  phoneNumber: string;
  templateId: string;
  params: string[];
  /** Readable copy of the rendered message for the admin log. */
  text?: string;
  userId?: string;
  claimId?: Types.ObjectId;
}

export type SendTemplateResult =
  | { ok: true; message: IWhatsAppMessage | null; messageId?: string }
  | { ok: false; message: IWhatsAppMessage | null; error: string };

const toDestination = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
};

export async function sendTemplate(args: SendTemplateArgs): Promise<SendTemplateResult> {
  const destination = toDestination(args.phoneNumber);
  const source = process.env.GUPSHUP_SOURCE_NUMBER!;
  const base = {
    direction: "outbound" as const,
    source,
    destination,
    messageType: "template",
    templateId: args.templateId,
    text: args.text,
    userId: args.userId,
    claimId: args.claimId,
  };

  let res: Response;
  let body = "";
  try {
    res = await fetch(GUPSHUP_TEMPLATE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        apikey: process.env.GUPSHUP_API_KEY!,
      },
      body: new URLSearchParams({
        source,
        destination,
        "src.name": process.env.GUPSHUP_APP_NAME!,
        template: JSON.stringify({ id: args.templateId, params: args.params }),
      }).toString(),
    });
    body = await res.text();
  } catch (err) {
    return { ok: false, message: await logFailure(base, String(err)), error: String(err) };
  }

  let data: { messageId?: string; status?: string; message?: string; details?: string } = {};
  try {
    data = JSON.parse(body);
  } catch {
    // Gupshup occasionally returns non-JSON on success — skip id capture.
  }

  if (!res.ok) {
    const error = `Gupshup ${res.status}: ${data.details ?? data.message ?? body}`;
    return { ok: false, message: await logFailure(base, error), error };
  }

  // Without an id the webhook can't update the row, so only log what we can follow.
  let message: IWhatsAppMessage | null = null;
  if (data.messageId) {
    message = await WhatsAppMessage.create({
      ...base,
      gsId: data.messageId,
      status: "enqueued",
      statusHistory: [{ status: "enqueued", at: new Date() }],
      raw: data,
    });
  }
  return { ok: true, message, messageId: data.messageId };
}

async function logFailure(
  base: Record<string, unknown>,
  error: string,
): Promise<IWhatsAppMessage | null> {
  try {
    return await WhatsAppMessage.create({
      ...base,
      status: "failed",
      errorReason: error.slice(0, 500),
      statusHistory: [{ status: "failed", at: new Date(), reason: error.slice(0, 500) }],
    });
  } catch {
    return null;
  }
}
