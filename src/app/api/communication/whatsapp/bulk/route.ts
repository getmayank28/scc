import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { recipients, templateId, templateParams } = await req.json();
  // recipients: ["919876543210", "918765432109", ...]
  // templateParams: ["John", "Order #123"] — values for {{1}}, {{2}} etc.

  const results = [];

  for (const destination of recipients) {
    const params = new URLSearchParams({
      channel: "whatsapp",
      source: process.env.GUPSHUP_SOURCE_NUMBER!,
      destination,
      "src.name": process.env.GUPSHUP_APP_NAME!,
      template: JSON.stringify({
        id: templateId, // UUID from Gupshup dashboard
        params: templateParams,
      }),
    });

    const res = await fetch("https://api.gupshup.io/sm/api/v1/template/msg", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        apikey: process.env.GUPSHUP_API_KEY!,
      },
      body: params.toString(),
    });

    const data = await res.json();
    results.push({ destination, ...data });

    // Add a small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 300));
  }

  return NextResponse.json({ results });
}
