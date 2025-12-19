import { verifyChatToken } from "@/lib/utils/chatToken";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return Response.json(
      { valid: false, error: "Missing or invalid Authorization header" },
      { status: 401 }
    );
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    verifyChatToken(token);

    return Response.json({
      valid: true,
      message: "Valid token",
    });
  } catch {
    return Response.json(
      {
        valid: false,
        error: "Invalid token",
      },
      { status: 401 }
    );
  }
}
