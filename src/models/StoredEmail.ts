import mongoose, { Document, Schema } from "mongoose";

// A single email cached from Unipile, stored in the ALREADY-FORMATTED shape the
// demo UI consumes — the merge of the list (DemoMessage) and detail
// (EmailDetail) fields. Formatting (issuer tagging, htmlToText) runs once at
// sync time; read routes return these records unchanged so the UI output is
// byte-identical whether served live or from cache.
//
// Bodies are stored (they survive trial expiry). Attachment BYTES are not —
// only metadata; downloading a PDF still calls Unipile and stops working once
// the trial ends. See the sync plan.

interface StoredAttendee {
  display_name?: string;
  identifier?: string;
}

interface StoredAttachment {
  id: string;
  filename: string;
  size: number | null;
  mime: string | null;
}

export interface IStoredEmail extends Document {
  userId: string;
  accountId: string;
  accountEmail: string | null;

  unipileId: string; // Unipile `id`
  providerId: string | null; // `provider_id` — for the live attachment fetch
  threadId: string | null;
  messageId: string | null;

  issuer: string | null; // computed slug

  subject: string;
  date: Date | null;
  fromName: string;
  fromEmail: string;

  from: StoredAttendee | null;
  to: StoredAttendee[];
  cc: StoredAttendee[];
  bcc: StoredAttendee[];
  replyTo: StoredAttendee[];

  role: string | null;
  origin: string | null;
  readDate: Date | null;
  folders: string[];

  hasAttachments: boolean;
  attachments: StoredAttachment[];

  bodyPlain: string;
  bodyHtmlLength: number;

  syncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AttendeeSchema = new Schema<StoredAttendee>(
  { display_name: String, identifier: String },
  { _id: false },
);

const AttachmentSchema = new Schema<StoredAttachment>(
  {
    id: { type: String, required: true },
    filename: { type: String, required: true },
    size: { type: Number, default: null },
    mime: { type: String, default: null },
  },
  { _id: false },
);

const StoredEmailSchema = new Schema<IStoredEmail>(
  {
    userId: { type: String, ref: "User", required: true, index: true },
    accountId: { type: String, required: true, index: true },
    accountEmail: { type: String, default: null },

    unipileId: { type: String, required: true },
    providerId: { type: String, default: null },
    threadId: { type: String, default: null },
    messageId: { type: String, default: null },

    issuer: { type: String, default: null, index: true },

    subject: { type: String, default: "(no subject)" },
    date: { type: Date, default: null },
    fromName: { type: String, default: "" },
    fromEmail: { type: String, default: "" },

    from: { type: AttendeeSchema, default: null },
    to: { type: [AttendeeSchema], default: [] },
    cc: { type: [AttendeeSchema], default: [] },
    bcc: { type: [AttendeeSchema], default: [] },
    replyTo: { type: [AttendeeSchema], default: [] },

    role: { type: String, default: null },
    origin: { type: String, default: null },
    readDate: { type: Date, default: null },
    folders: { type: [String], default: [] },

    hasAttachments: { type: Boolean, default: false },
    attachments: { type: [AttachmentSchema], default: [] },

    bodyPlain: { type: String, default: "" },
    bodyHtmlLength: { type: Number, default: 0 },

    syncedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// Upsert key: one row per (account, message).
StoredEmailSchema.index({ accountId: 1, unipileId: 1 }, { unique: true });
// Windowed reads: user + account + date range, newest first.
StoredEmailSchema.index({ userId: 1, accountId: 1, date: -1 });

const StoredEmail =
  (mongoose.models.StoredEmail as mongoose.Model<IStoredEmail>) ||
  mongoose.model<IStoredEmail>("StoredEmail", StoredEmailSchema);

export default StoredEmail;
