import jwt, { JwtPayload } from "jsonwebtoken";

export interface IssueChatTokenParams {
  userId?: string;
  anonymousId?: string;
}

export interface ChatTokenPayload extends JwtPayload {
  sub: string; // userId OR anonymousId
  scope: "chat:write";
}

export function issueChatToken({
  userId,
  anonymousId,
}: IssueChatTokenParams): string {
  if (!userId && !anonymousId) {
    throw new Error("Either userId or anonymousId must be provided");
  }

  const secret = process.env.CHAT_TOKEN_SECRET;
  if (!secret) {
    throw new Error("CHAT_TOKEN_SECRET is not defined");
  }

  const payload: ChatTokenPayload = {
    sub: userId ?? anonymousId!,
    scope: "chat:write",
  };

  return jwt.sign(payload, secret, {
    expiresIn: "15m",
  });
}

export function verifyChatToken(token: string): ChatTokenPayload {
  const secret = process.env.CHAT_TOKEN_SECRET;
  if (!secret) {
    throw new Error("CHAT_TOKEN_SECRET is not defined");
  }

  const decoded = jwt.verify(token, secret) as ChatTokenPayload;

  if (decoded.scope !== "chat:write") {
    throw new Error("Invalid token scope");
  }

  if (!decoded.sub) {
    throw new Error("Invalid token subject");
  }

  return decoded;
}
