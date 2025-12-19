import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import ChatSessionModel from "@/models/ChatSession";
import { issueChatToken } from "@/lib/utils/chatToken";
import dbConnect from "@/lib/utils/dbConnet";

export async function POST(req: Request) {
  await dbConnect();

  const session = await getServerSession(authOptions);
  const { sessionId } = await req.json();

  const chatSession = await ChatSessionModel.findOne({ sessionId });
  if (!chatSession) return new Response("Session not found", { status: 404 });

  if (chatSession.userId && chatSession.userId !== session?.user?._id) {
    return new Response("Forbidden", { status: 403 });
  }

  const token = issueChatToken({
    userId: session?.user?._id,
    anonymousId: chatSession.anonymousId,
  });

  return Response.json({ token: "Bearer " + token });
}
