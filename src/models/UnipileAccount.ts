import mongoose, { Schema, Document } from "mongoose";

// One connected Unipile mailbox, bound to the app user who connected it.
// The binding is what every read route checks before returning inbox data —
// it replaces the dev-only in-memory map used during the spike.
//
// `accountId` is Unipile's opaque id (not an email). `emailAddress` is stored
// for display only; matching is on userId, so a user may connect an inbox that
// differs from their login email.
export interface IUnipileAccount extends Document {
  userId: string;
  accountId: string;
  provider?: string;
  emailAddress?: string;
  status: "connected" | "disconnected";
  connectedAt: Date;
  // Sync state for the DB cache. syncedThroughDate = oldest email date covered
  // by a completed sync; a request whose window starts at/after this is served
  // from the DB without calling Unipile.
  lastSyncedAt?: Date;
  syncedThroughDate?: Date;
  lastSyncCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const UnipileAccountSchema = new Schema<IUnipileAccount>(
  {
    userId: { type: String, ref: "User", required: true, index: true },
    accountId: { type: String, required: true, unique: true },
    provider: String,
    emailAddress: { type: String, lowercase: true, trim: true },
    status: {
      type: String,
      enum: ["connected", "disconnected"],
      default: "connected",
      index: true,
    },
    connectedAt: { type: Date, default: Date.now },
    lastSyncedAt: { type: Date, default: null },
    syncedThroughDate: { type: Date, default: null },
    lastSyncCount: { type: Number, default: null },
  },
  { timestamps: true },
);

const UnipileAccount =
  (mongoose.models.UnipileAccount as mongoose.Model<IUnipileAccount>) ||
  mongoose.model<IUnipileAccount>("UnipileAccount", UnipileAccountSchema);

export default UnipileAccount;
