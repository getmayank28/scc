import mongoose, { Document, Schema, Model } from "mongoose";

export interface AnonymousSession extends Document {
  sessionId: string;
  answers: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

const AnonymousSessionSchema: Schema<AnonymousSession> = new Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },
    answers: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

const AnonymousSessionModel: Model<AnonymousSession> =
  mongoose.models.AnonymousSession ||
  mongoose.model<AnonymousSession>("AnonymousSession", AnonymousSessionSchema);

export default AnonymousSessionModel;
