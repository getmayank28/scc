// Canonical formatting from a raw Unipile email → the stored/served shapes.
//
// This is the single source of truth for how a Unipile email becomes what the
// UI sees. Both the sync job and the read routes use it, so cached output is
// byte-identical to live output. If you change formatting, re-sync.

import { ISSUER_BY_SLUG } from "./issuers";
import type { UnipileEmail } from "./types";

export function issuerFor(address: string): string | null {
  const lower = address.toLowerCase();
  for (const [slug, issuer] of ISSUER_BY_SLUG) {
    if (
      issuer.domains.some((d) => lower.endsWith(`@${d}`) || lower.includes(d))
    ) {
      return slug;
    }
  }
  return null;
}

// Collapse an HTML body to readable text. Display-only; real parsing is separate.
export function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|table|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();
}

// The full formatted record we persist. Read routes derive both the list shape
// and the detail shape from this, so storing it once covers both.
export interface FormattedEmail {
  unipileId: string;
  providerId: string | null;
  threadId: string | null;
  messageId: string | null;
  issuer: string | null;
  subject: string;
  date: string | null;
  fromName: string;
  fromEmail: string;
  from: UnipileEmail["from_attendee"] | null;
  to: NonNullable<UnipileEmail["to_attendees"]>;
  cc: NonNullable<UnipileEmail["cc_attendees"]>;
  bcc: NonNullable<UnipileEmail["bcc_attendees"]>;
  replyTo: NonNullable<UnipileEmail["reply_to_attendees"]>;
  role: string | null;
  origin: string | null;
  readDate: string | null;
  folders: string[];
  hasAttachments: boolean;
  attachments: Array<{
    id: string;
    filename: string;
    size: number | null;
    mime: string | null;
  }>;
  bodyPlain: string;
  bodyHtmlLength: number;
}

export function formatEmail(email: UnipileEmail): FormattedEmail {
  const fromEmail = email.from_attendee?.identifier ?? "";
  const bodyHtml = email.body ?? "";
  const bodyPlain = email.body_plain?.trim()
    ? email.body_plain
    : htmlToText(bodyHtml);

  return {
    unipileId: email.id,
    providerId: email.provider_id ?? null,
    threadId: email.thread_id ?? null,
    messageId: email.message_id ?? null,
    issuer: issuerFor(fromEmail),
    subject: email.subject ?? "(no subject)",
    date: email.date ?? null,
    fromName: email.from_attendee?.display_name ?? fromEmail,
    fromEmail,
    from: email.from_attendee ?? null,
    to: email.to_attendees ?? [],
    cc: email.cc_attendees ?? [],
    bcc: email.bcc_attendees ?? [],
    replyTo: email.reply_to_attendees ?? [],
    role: email.role ?? null,
    origin: email.origin ?? null,
    readDate: email.read_date ?? null,
    folders: email.folders ?? [],
    hasAttachments: email.has_attachments ?? false,
    attachments: (email.attachments ?? []).map((a) => ({
      id: a.id,
      filename: a.name ?? a.filename ?? "attachment",
      size: a.size ?? null,
      mime: a.mime ?? null,
    })),
    bodyPlain,
    bodyHtmlLength: bodyHtml.length,
  };
}
