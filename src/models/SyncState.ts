import mongoose, { Schema } from "mongoose";

/**
 * Small key → state rows for background jobs: the transaction sync's cursor,
 * and when each webhook last fired (so a webhook Cuelinks auto-disabled after
 * repeated failures shows up as "last seen 3 days ago" in admin).
 */
export interface SyncStateProps {
  key: string;
  cursor: Date | null;
  lastRunAt: Date | null;
  lastResult: Record<string, unknown> | null;
}

const SyncStateSchema = new Schema<SyncStateProps>(
  {
    key: { type: String, required: true, unique: true },
    cursor: { type: Date, default: null },
    lastRunAt: { type: Date, default: null },
    lastResult: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true },
);

const SyncState: mongoose.Model<SyncStateProps> =
  mongoose.models.SyncState ||
  mongoose.model<SyncStateProps>("SyncState", SyncStateSchema);

export default SyncState;

export const SYNC_KEYS = {
  transactions: "cuelinks-transactions",
  txnWebhook: "cuelinks-webhook-transactions",
  campaignWebhook: "cuelinks-webhook-campaigns",
} as const;

/** Stamps `key` as having run now; failures are swallowed (best-effort bookkeeping). */
export async function touchSyncState(
  key: string,
  set: Partial<Omit<SyncStateProps, "key">> = {},
): Promise<void> {
  await SyncState.updateOne(
    { key },
    { $set: { lastRunAt: new Date(), ...set } },
    { upsert: true },
  ).catch(() => {});
}
