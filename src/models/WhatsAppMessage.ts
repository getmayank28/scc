import mongoose, { Document, Schema } from "mongoose";

export type WhatsAppDirection = "outbound" | "inbound";

export type WhatsAppStatus =
  | "enqueued"
  | "sent"
  | "delivered"
  | "read"
  | "failed"
  | "received"
  | "deleted"
  | "other";

export interface IWhatsAppMessage extends Document {
  gsId?: string; // Gupshup message id (outbound)
  externalId?: string; // inbound provider id
  direction: WhatsAppDirection;
  status: WhatsAppStatus;
  source?: string; // business number
  destination?: string; // user number (outbound) or business (inbound)
  senderPhone?: string; // inbound sender
  senderName?: string;
  messageType?: string; // text, image, template, ...
  templateId?: string; // Gupshup template UUID (for dedup)
  text?: string;
  errorCode?: string;
  errorReason?: string;
  statusHistory: Array<{
    status: WhatsAppStatus;
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

const WhatsAppMessageSchema: Schema<IWhatsAppMessage> = new Schema(
  {
    gsId: { type: String, index: true },
    externalId: { type: String, index: true },
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
        "read",
        "failed",
        "received",
        "deleted",
        "other",
      ],
      required: true,
      index: true,
    },
    source: String,
    destination: { type: String, index: true },
    senderPhone: { type: String, index: true },
    senderName: String,
    messageType: String,
    templateId: { type: String, index: true },
    text: String,
    errorCode: String,
    errorReason: String,
    statusHistory: { type: [StatusHistorySchema], default: [] },
    raw: Schema.Types.Mixed,
    providerTimestamp: Date,
  },
  { timestamps: true },
);

const WhatsAppMessage =
  (mongoose.models.WhatsAppMessage as mongoose.Model<IWhatsAppMessage>) ||
  mongoose.model<IWhatsAppMessage>("WhatsAppMessage", WhatsAppMessageSchema);

export default WhatsAppMessage;
