import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import { issueChatToken } from "@/lib/utils/chatToken";
import dbConnect from "@/lib/utils/dbConnet";

export async function POST() {
  await dbConnect();

  const session = await getServerSession(authOptions);

  const token = issueChatToken({
    userId: session?.user?._id,
  });

  return Response.json({ token: "Bearer " + token });
}
