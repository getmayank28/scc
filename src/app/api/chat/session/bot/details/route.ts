import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { ZIJUS_BOT_ID, ZIJUS_SESSION_API_URL } from "@/lib/constants/zijus";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

interface PayloadProps {
  bot_id: string;
  session_id: string;
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const session_Id = searchParams.get("sessionId");

  if (!session_Id) {
    return NextResponse.json(
      { error: "Session Id is required" },
      { status: 400 }
    );
  }

  try {
    const payload: PayloadProps = {
      bot_id: ZIJUS_BOT_ID,
      session_id: session_Id,
    };

    const response = await fetch(`${ZIJUS_SESSION_API_URL}get-sessions-data`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_ZIJUS_API_TOKEN}`,
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
      { error: "Failed to get the user session details" },
      { status: 500 }
    );
  }
}
