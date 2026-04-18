import jwt, { JwtPayload } from "jsonwebtoken";

export interface IssueChatTokenParams {
  userId?: string;
}
const tokenScope = ["chat:write", "bot:table:read"] as const;

export interface ChatTokenPayload extends JwtPayload {
  userId: string; // userId OR anonymousId
  scopes: typeof tokenScope;
}

export function issueChatToken({ userId = "" }: IssueChatTokenParams): string {
  const PRIVATE_KEY = process.env.CHAT_TOKEN_SECRET;

  if (!PRIVATE_KEY) {
    throw new Error("CHAT_TOKEN_SECRET is not defined");
  }

  const payload: ChatTokenPayload = {
    userId: userId,
    scopes: tokenScope,
  };

  return jwt.sign(payload, PRIVATE_KEY, {
    algorithm: "RS256",
    expiresIn: "2d",
    issuer: "gofisense",
    audience: "partner-chat",
    keyid: "chat-key-2026",
  });
}

export function verifyChatToken(token: string): ChatTokenPayload {
  const secret = process.env.CHAT_TOKEN_SECRET;
  if (!secret) {
    throw new Error("CHAT_TOKEN_SECRET is not defined");
  }

  const decoded = jwt.verify(token, secret) as ChatTokenPayload;

  if (
    !decoded.scope?.includes("chat:write") &&
    !decoded.scope?.includes("bot:table:read")
  ) {
    throw new Error("Invalid token scope");
  }

  if (!decoded.sub) {
    throw new Error("Invalid token subject");
  }

  return decoded;
}
