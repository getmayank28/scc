import { ZIJUS_BOT_ID, ZIJUS_SESSION_API_URL } from "@/lib/constants/zijus";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/options";

interface PayloadProps {
  bot_id: string;
  user_id: string | undefined;
  date: string;
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const payload: PayloadProps = {
      bot_id: ZIJUS_BOT_ID,
      user_id: session?.user?._id,
      date: "2026-01-17",
    };

    const response = await fetch(ZIJUS_SESSION_API_URL, {
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
      { error: "Failed to get the user session" },
      { status: 500 },
    );
  }
}
