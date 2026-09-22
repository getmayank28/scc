// Client-side helper for /api/demo/email/*, mirroring `fetchRecommend`.

import type { ApiSuccess, ApiError } from "@/lib/utils/ApiResponse";

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  const payload = (await res.json()) as ApiSuccess | ApiError;
  if (!payload.success) throw new Error(payload.message || "Request failed");
  return payload.result as T;
}

export interface DemoAttachment {
  id: string;
  filename: string;
  size: number | null;
  looksLikePdf: boolean;
}

export interface DemoMessage {
  id: string;
  /** provider_id — pass THIS (not id) to the attachment endpoint. */
  providerId: string | null;
  /** Which connected mailbox this came from. */
  accountId: string;
  accountEmail: string | null;
  subject: string;
  date: string | null;
  fromName: string;
  fromEmail: string;
  issuer: string | null;
  attachments: DemoAttachment[];
}

export interface MessagesResult {
  /** "synced-now" when this request pulled from Unipile, "db" when served from cache. */
  source: "synced-now" | "db";
  accounts: Array<{ accountId: string; emailAddress: string | null }>;
  /** Mailboxes this request had to sync (empty on a cache hit). */
  syncedNow: string[];
  /** Issuer domains whose sync query failed. */
  syncFailed: string[];
  total: number;
  withAttachments: number;
  messages: DemoMessage[];
}

export interface AttachmentProbe {
  filename: string | null;
  contentType: string;
  bytes: number;
  isPdf: boolean;
  version: string | null;
  encrypted: boolean;
  revision: string | null;
  verdict: "not-a-pdf" | "password-protected" | "open";
}

export interface EmailDetail {
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

export interface ConnectionStatus {
  connected: boolean;
  accounts: Array<{
    accountId: string;
    emailAddress: string | null;
    provider: string | null;
  }>;
}

export function fetchStatus() {
  return call<ConnectionStatus>("/api/demo/email/status");
}

export function connectAccount() {
  return call<{ url: string }>("/api/demo/email/connect", { method: "POST" });
}

export function fetchEmailDetail(providerId: string, accountId?: string) {
  const qs = new URLSearchParams({ provider_id: providerId });
  if (accountId) qs.set("account_id", accountId);
  return call<EmailDetail>(`/api/demo/email/message?${qs.toString()}`);
}

export function fetchMessages(params: {
  accountId?: string;
  issuer?: string;
  afterDays?: number;
}) {
  const qs = new URLSearchParams();
  if (params.accountId) qs.set("account_id", params.accountId);
  if (params.issuer) qs.set("issuer", params.issuer);
  if (params.afterDays) qs.set("after_days", String(params.afterDays));
  return call<MessagesResult>(`/api/demo/email/messages?${qs.toString()}`);
}

export function probeAttachment(params: {
  emailId: string;
  attachmentId: string;
  accountId?: string;
}) {
  const qs = new URLSearchParams({
    email_id: params.emailId,
    attachment_id: params.attachmentId,
  });
  if (params.accountId) qs.set("account_id", params.accountId);
  return call<AttachmentProbe>(`/api/demo/email/attachment?${qs.toString()}`);
}

export function attachmentDownloadUrl(params: {
  emailId: string;
  attachmentId: string;
  accountId?: string;
}) {
  const qs = new URLSearchParams({
    email_id: params.emailId,
    attachment_id: params.attachmentId,
    download: "1",
  });
  if (params.accountId) qs.set("account_id", params.accountId);
  return `/api/demo/email/attachment?${qs.toString()}`;
}
