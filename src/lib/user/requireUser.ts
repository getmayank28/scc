import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

// Identity gate for user-scoped endpoints. The user always comes from the
// session — never from a userId in the URL or body, which any caller can forge.
//
// Usage in a route:
//   const auth = await requireUser();
//   if (auth instanceof Response) return auth;
//   ... use auth.userId ...

export async function requireUser(): Promise<{ userId: string } | Response> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?._id;
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  return { userId };
}
