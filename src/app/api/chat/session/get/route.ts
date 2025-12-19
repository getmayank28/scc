import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/lib/utils/dbConnet";
import ChatSessionModel from "@/models/ChatSession";
import { getServerSession } from "next-auth";

export async function POST(req: Request) {
  await dbConnect();
  const session = await getServerSession(authOptions);

  const body = await req.json();
  if (!body?.id && !session?.user._id) {
    return Response.json({ error: "Id is required" }, { status: 400 });
  }

  const data = session?.user._id
    ? { userId: session.user._id }
    : { anonymousId: body?.id };

  const userSessions = await ChatSessionModel.find({
    ...data,
  }).sort({ createdAt: -1 });

  return Response.json({ sessions: userSessions });
}
