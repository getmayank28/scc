// app/api/whatsapp/send/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { to, message } = await req.json();

  const params = new URLSearchParams({
    channel: "whatsapp",
    source: process.env.GUPSHUP_SOURCE_NUMBER!,
    destination: to, // e.g. "919876543210"
    "src.name": process.env.GUPSHUP_APP_NAME!,
    message: JSON.stringify({
      isHSM: "false",
      type: "text",
      text: message,
    }),
  });

  const res = await fetch("https://api.gupshup.io/sm/api/v1/msg", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      apikey: process.env.GUPSHUP_API_KEY!,
    },
    body: params.toString(),
  });

  const data = await res.json();
  return NextResponse.json(data);
}
