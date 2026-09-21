// Read the cached emails back in the exact shapes the routes return, so the UI
// output is identical whether served from Unipile (live) or the DB (cache).

import "server-only";

import dbConnect from "@/lib/utils/dbConnet";
import StoredEmail, { type IStoredEmail } from "@/models/StoredEmail";
import { ISSUER_BY_SLUG } from "./issuers";

// Mirror of the messages route's DemoMessage.
export interface StoredDemoMessage {
  id: string;
  providerId: string | null;
  accountId: string;
  accountEmail: string | null;
  subject: string;
  date: string | null;
  fromName: string;
  fromEmail: string;
  issuer: string | null;
  attachments: Array<{
    id: string;
    filename: string;
    size: number | null;
    looksLikePdf: boolean;
  }>;
}

function toDemoMessage(row: IStoredEmail): StoredDemoMessage {
  return {
    id: row.unipileId,
    providerId: row.providerId,
    accountId: row.accountId,
    accountEmail: row.accountEmail,
    subject: row.subject,
    date: row.date ? row.date.toISOString() : null,
    fromName: row.fromName,
    fromEmail: row.fromEmail,
    issuer: row.issuer,
    attachments: row.attachments.map((a) => ({
      id: a.id,
      filename: a.filename,
      size: a.size,
      looksLikePdf:
        /\.pdf$/i.test(a.filename) || (a.mime ?? "").includes("pdf"),
    })),
  };
}

/** Windowed list read: user's accounts, issuer + date filter, newest first. */
export async function readStoredMessages(params: {
  userId: string;
  accountIds: string[];
  issuerSlug?: string;
  afterDays: number;
}): Promise<StoredDemoMessage[]> {
  await dbConnect();

  const after = new Date(Date.now() - params.afterDays * 86_400_000);
  const query: Record<string, unknown> = {
    userId: params.userId,
    accountId: { $in: params.accountIds },
    date: { $gte: after },
  };

  if (params.issuerSlug) {
    if (!ISSUER_BY_SLUG.has(params.issuerSlug)) return [];
    query.issuer = params.issuerSlug;
  } else {
    // "All issuers" = only tagged issuer mail (skip anything untagged).
    query.issuer = { $ne: null };
  }

  const rows = await StoredEmail.find(query).sort({ date: -1 }).lean();
  return (rows as unknown as IStoredEmail[]).map(toDemoMessage);
}

// Mirror of the message route's EmailDetail.
export interface StoredEmailDetail {
  id: string;
  providerId: string | null;
  threadId: string | null;
  messageId: string | null;
  subject: string;
  date: string | null;
  readDate: string | null;
  role: string | null;
  origin: string | null;
  from: { display_name?: string; identifier?: string } | null;
  to: Array<{ display_name?: string; identifier?: string }>;
  cc: Array<{ display_name?: string; identifier?: string }>;
  bcc: Array<{ display_name?: string; identifier?: string }>;
  replyTo: Array<{ display_name?: string; identifier?: string }>;
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

/** Detail read for one message the user owns, by provider_id. */
export async function readStoredDetail(params: {
  userId: string;
  providerId: string;
}): Promise<StoredEmailDetail | null> {
  await dbConnect();
  const row = (await StoredEmail.findOne({
    userId: params.userId,
    providerId: params.providerId,
  }).lean()) as IStoredEmail | null;
  if (!row) return null;

  return {
    id: row.unipileId,
    providerId: row.providerId,
    threadId: row.threadId,
    messageId: row.messageId,
    subject: row.subject,
    date: row.date ? row.date.toISOString() : null,
    readDate: row.readDate ? row.readDate.toISOString() : null,
    role: row.role,
    origin: row.origin,
    from: row.from,
    to: row.to,
    cc: row.cc,
    bcc: row.bcc,
    replyTo: row.replyTo,
    folders: row.folders,
    hasAttachments: row.hasAttachments,
    attachments: row.attachments,
    bodyPlain: row.bodyPlain,
    bodyHtmlLength: row.bodyHtmlLength,
  };
}
