import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/lib/utils/dbConnet";
import ChatSessionModel from "@/models/ChatSession";
import { getServerSession } from "next-auth";
import { v4 as uuid } from "uuid";

export async function POST(req: Request) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  const body = await req.json();

  const sessionId = uuid();

  await ChatSessionModel.create({
    sessionId,
    userId: session?.user?._id,
    anonymousId: body.anonymousId,
    status: "active",
    createdAt: new Date(),
  });

  return Response.json({ sessionId });
}
