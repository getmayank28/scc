// Unipile API response shapes (email subset).
//
// Only the fields the demo actually consumes are typed here. Unipile returns
// more per object; anything untyped is intentionally ignored rather than
// guessed at.

export interface UnipileAttendee {
  display_name?: string;
  identifier?: string;
}

export interface UnipileAttachment {
  id: string;
  /** Unipile returns `name`; older/other shapes may use `filename`. */
  name?: string;
  filename?: string;
  size?: number;
  mime?: string;
  extension?: string;
  cid?: string;
}

export interface UnipileEmail {
  id: string;
  /**
   * The provider's own message uid. The per-email and attachment-download
   * endpoints resolve on THIS, not on `id` — passing `id` there 404s. Always
   * pair it with `account_id`.
   */
  provider_id?: string;
  subject?: string;
  date?: string;
  read_date?: string | null;
  role?: string;
  origin?: string;
  message_id?: string;
  thread_id?: string;
  has_attachments?: boolean;
  from_attendee?: UnipileAttendee;
  to_attendees?: UnipileAttendee[];
  cc_attendees?: UnipileAttendee[];
  bcc_attendees?: UnipileAttendee[];
  reply_to_attendees?: UnipileAttendee[];
  folders?: string[];
  body?: string;
  body_plain?: string;
  attachments?: UnipileAttachment[];
}

export interface UnipileEmailList {
  object?: string;
  items: UnipileEmail[];
  cursor?: string | null;
}

export interface UnipileHostedAuthLink {
  object?: string;
  url: string;
}

/** Payload Unipile POSTs to `notify_url` once an account finishes connecting. */
export interface UnipileNotifyPayload {
  status: "CREATION_SUCCESS" | "RECONNECTED" | string;
  account_id: string;
  /** Echoes the `name` we sent on the hosted-auth link — our user `_id`. */
  name?: string;
}

/** Query params for GET /api/v1/emails. All filtering is server-side. */
export interface ListEmailsParams {
  account_id: string;
  limit?: number;
  cursor?: string;
  before?: string;
  after?: string;
  from?: string;
  to?: string;
  any_email?: string;
  folder?: string;
  role?: string;
  search?: string;
  meta_only?: boolean;
}

export interface UnipileAttachmentFile {
  buffer: ArrayBuffer;
  contentType: string;
  filename?: string;
}
