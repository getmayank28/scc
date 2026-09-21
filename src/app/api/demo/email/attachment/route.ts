import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/options";
import { ApiResponse } from "@/lib/utils/ApiResponse";
import { getAttachment, UnipileError } from "@/lib/unipile/client";
import { resolveAccountForUser } from "@/lib/unipile/binding";

export const runtime = "nodejs";

/**
 * A PDF is encrypted if its trailer contains an /Encrypt dictionary. Checking
 * the raw bytes avoids pulling in a PDF library for the spike — we only need
 * to know whether a password stands between us and the data.
 */
function inspectPdf(bytes: Uint8Array) {
  const head = new TextDecoder("latin1").decode(bytes.subarray(0, 1024));
  const isPdf = head.startsWith("%PDF-");
  const version = isPdf ? head.slice(5, 8) : null;

  const whole = new TextDecoder("latin1").decode(bytes);
  const encrypted = /\/Encrypt[\s\d<]/.test(whole);

  // Revision hints at the algorithm: R2/R3 = RC4, R6 = AES-256.
  const revision = /\/R\s*(\d+)/.exec(whole)?.[1] ?? null;

  return { isPdf, version, encrypted, revision };
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?._id;
  if (!userId) return ApiResponse.error("Unauthorized", 401);

  const url = new URL(req.url);
  // This is the email provider_id (what messages returns as providerId).
  const emailProviderId = url.searchParams.get("email_id") ?? "";
  const attachmentId = url.searchParams.get("attachment_id") ?? "";
  const download = url.searchParams.get("download") === "1";
  let accountId = url.searchParams.get("account_id") ?? "";

  if (!emailProviderId || !attachmentId) {
    return ApiResponse.error("email_id and attachment_id are required", 400);
  }

  const resolved = await resolveAccountForUser(userId, accountId || undefined);
  if ("error" in resolved) {
    return resolved.error === "not-connected"
      ? ApiResponse.error("NOT_CONNECTED", 409)
      : ApiResponse.error("Account not connected by this user", 403);
  }
  accountId = resolved.accountId;

  try {
    const file = await getAttachment(emailProviderId, attachmentId, accountId);
    const bytes = new Uint8Array(file.buffer);

    // Stream the raw file back when explicitly asked, so the PDF can be opened
    // by hand. Nothing is persisted either way.
    if (download) {
      return new Response(file.buffer, {
        headers: {
          "Content-Type": file.contentType,
          "Content-Disposition": `inline; filename="${file.filename ?? "attachment"}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    const pdf = inspectPdf(bytes);

    return ApiResponse.success("ok", 200, {
      filename: file.filename ?? null,
      contentType: file.contentType,
      bytes: bytes.byteLength,
      ...pdf,
      // The finding that decides the feature.
      verdict: !pdf.isPdf
        ? "not-a-pdf"
        : pdf.encrypted
          ? "password-protected"
          : "open",
    });
  } catch (err) {
    console.error("[/api/demo/email/attachment] failed:", err);
    return ApiResponse.error(
      err instanceof UnipileError ? err.message : "Could not fetch attachment",
      500,
    );
  }
}
