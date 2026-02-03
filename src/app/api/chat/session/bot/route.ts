import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { CHANNEL } from "@/lib/constants/channel";
import { ZIJUS_BOT_ID, ZIJUS_SESSION_API_URL } from "@/lib/constants/zijus";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

interface PayloadProps {
  bot_id: string;
  user_id: string | undefined;
  channel: 'recommendation'
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
      channel:CHANNEL.CARD_RECOMMENDATION as 'recommendation'
    };

    const response = await fetch(
      `${ZIJUS_SESSION_API_URL}get-sessions-by-user`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_ZIJUS_API_TOKEN}`,
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("Zijus API Error:", error);

    return NextResponse.json(
      { error: "Failed to get the user session" },
      { status: 500 }
    );
  }
}
