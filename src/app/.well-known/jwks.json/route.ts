import { NextResponse } from "next/server";
import { importSPKI, exportJWK } from "jose";

const PUBLIC_KEY_PEM = process.env.CHAT_TOKEN_PUBLIC_SECRET!;

// Cache the result (important for performance)
let cachedJWKS: unknown = null;

export async function GET() {
  if (!cachedJWKS) {
    const publicKey = await importSPKI(PUBLIC_KEY_PEM, "RS256");
    const jwk = await exportJWK(publicKey);

    jwk.use = "sig";
    jwk.alg = "RS256";
    jwk.kid = "chat-key-2026";

    cachedJWKS = {
      keys: [jwk],
    };
  }

  return NextResponse.json(cachedJWKS, {
    headers: {
      "Cache-Control": "public, max-age=600, immutable",
    },
  });
}
