import mongoose, { Document, Schema } from "mongoose";

export type EmailDirection = "outbound" | "inbound";

export type EmailStatus =
  | "enqueued"
  | "sent"
  | "delivered"
  | "opened"
  | "clicked"
  | "bounced"
  | "complained"
  | "failed"
  | "other";

export interface IEmailMessage extends Document {
  providerId?: string; // Resend message id
  direction: EmailDirection;
  status: EmailStatus;
  from?: string;
  recipient?: string; // user email (outbound)
  subject?: string;
  templateId?: string; // logical template name (for dedup), e.g. "fisense_launch_email"
  errorCode?: string;
  errorReason?: string;
  statusHistory: Array<{
    status: EmailStatus;
    at: Date;
    code?: string;
    reason?: string;
  }>;
  raw: unknown;
  providerTimestamp?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const StatusHistorySchema = new Schema(
  {
    status: { type: String, required: true },
    at: { type: Date, required: true },
    code: String,
    reason: String,
  },
  { _id: false },
);

const EmailMessageSchema: Schema<IEmailMessage> = new Schema(
  {
    providerId: { type: String, index: true },
    direction: {
      type: String,
      enum: ["outbound", "inbound"],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: [
        "enqueued",
        "sent",
        "delivered",
        "opened",
        "clicked",
        "bounced",
        "complained",
        "failed",
        "other",
      ],
      required: true,
      index: true,
    },
    from: String,
    recipient: { type: String, index: true, lowercase: true, trim: true },
    subject: String,
    templateId: { type: String, index: true },
    errorCode: String,
    errorReason: String,
    statusHistory: { type: [StatusHistorySchema], default: [] },
    raw: Schema.Types.Mixed,
    providerTimestamp: Date,
  },
  { timestamps: true },
);

const EmailMessage =
  (mongoose.models.EmailMessage as mongoose.Model<IEmailMessage>) ||
  mongoose.model<IEmailMessage>("EmailMessage", EmailMessageSchema);

export default EmailMessage;
