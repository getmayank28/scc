import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/options";
import { ApiResponse } from "@/lib/utils/ApiResponse";
import { accountsForUser } from "@/lib/unipile/binding";

export const runtime = "nodejs";

// Tells the page whether THIS user has a connected mailbox, so it can either
// show the inbox controls or prompt them to connect. Returns the address for
// display only.
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?._id;
  if (!userId) return ApiResponse.error("Unauthorized", 401);

  const accounts = await accountsForUser(userId);
  return ApiResponse.success("ok", 200, {
    connected: accounts.length > 0,
    accounts: accounts.map((a) => ({
      accountId: a.accountId,
      emailAddress: a.emailAddress ?? null,
      provider: a.provider ?? null,
    })),
  });
}
