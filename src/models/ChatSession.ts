import mongoose, { Document, Schema } from "mongoose";

export type SessionStatus = "active" | "closed";

export interface ChatSession extends Document {
  sessionId: string;
  userId?: string;
  anonymousId?: string;
  status: SessionStatus;
  metadata?: {
    userAgent?: string;
    ip?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ChatSessionSchema: Schema<ChatSession> = new Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    userId: {
      type: String,
      required: false,
      index: true,
    },

    anonymousId: {
      type: String,
      required: false,
      index: true,
    },

    status: {
      type: String,
      enum: ["active", "closed"],
      default: "active",
      index: true,
    },

    metadata: {
      userAgent: {
        type: String,
        required: false,
      },
      ip: {
        type: String,
        required: false,
      },
    },
  },
  {
    timestamps: true, // automatically adds createdAt & updatedAt
  }
);

const ChatSessionModel =
  (mongoose.models.ChatSession as mongoose.Model<ChatSession>) ||
  mongoose.model<ChatSession>("ChatSession", ChatSessionSchema);

export default ChatSessionModel;
