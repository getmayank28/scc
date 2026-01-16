import { ZIJUS_API_URL, ZIJUS_BOT_ID } from "@/lib/constants/zijus";
import { NextRequest, NextResponse } from "next/server";

interface PayloadProps {
  bot_id: string;
  messages?: Array<{ content: string }>;
  session_id?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { message, session_id, token } = body;

    if (!token) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const payload: PayloadProps = {
      bot_id: ZIJUS_BOT_ID,
      messages: [{ content: message }],
    };

    if (session_id) {
      payload.session_id = session_id;
    }
    const response = await fetch(ZIJUS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token?.token,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("Zijus API Error:", error);

    return NextResponse.json(
      { error: "Failed to connect to chat service" },
      { status: 500 }
    );
  }
}
