import "server-only";
import WhatsAppMessage from "@/models/WhatsAppMessage";

type GupshupSendResult = {
  messageId?: string;
  destination: string;
  source: string;
  text: string;
};

async function sendGupshupTemplate(
  phoneNumber: string,
  otp: string,
): Promise<GupshupSendResult> {
  const destination = `91${phoneNumber}`; // India country code
  const source = process.env.GUPSHUP_SOURCE_NUMBER!;
  const templateId = process.env.GUPSHUP_OTP_TEMPLATE_ID!;
  const message = `Your FiSense verification code is ${otp}. It is valid for 5 minutes. Do not share this with anyone.`;

  const params = new URLSearchParams({
    source,
    destination,
    "src.name": process.env.GUPSHUP_APP_NAME!,
    template: JSON.stringify({
      id: templateId,
      params: [otp],
    }),
  });

  const res = await fetch("https://api.gupshup.io/wa/api/v1/template/msg", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      apikey: process.env.GUPSHUP_API_KEY!,
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("[otp] gupshup error:", errorText);
    throw new Error(`Gupshup API error: ${res.status} — ${errorText}`);
  }

  let messageId: string | undefined;
  try {
    const data = (await res.json()) as { messageId?: string };
    messageId = data.messageId;
  } catch {
    // Gupshup occasionally returns non-JSON on success — skip id capture.
  }

  return { messageId, destination, source, text: message };
}

export async function sendWhatsAppOtp(
  phoneNumber: string,
  otp: string,
): Promise<void> {
  const sendResult = await sendGupshupTemplate(phoneNumber, otp);

  if (sendResult.messageId) {
    // Pre-insert so webhook `message-event` callbacks can upsert status
    // transitions (sent → delivered → read / failed) against this row. The
    // code itself is masked: this collection is readable from the admin side.
    await WhatsAppMessage.create({
      gsId: sendResult.messageId,
      direction: "outbound",
      status: "enqueued",
      source: sendResult.source,
      destination: sendResult.destination,
      messageType: "template",
      text: sendResult.text.replace(otp, "******"),
      statusHistory: [{ status: "enqueued", at: new Date() }],
    });
  }
}
