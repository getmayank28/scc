import mongoose, { Schema } from "mongoose";

/**
 * Short-lived cache for Cuelinks report responses and the campaign list,
 * keyed by endpoint + params. The admin tab fetches these on demand; caching
 * for about an hour keeps repeat views fast and well inside rate limits.
 */
export interface ReportCacheProps {
  key: string;
  payload: unknown;
  expiresAt: Date;
}

const ReportCacheSchema = new Schema<ReportCacheProps>({
  key: { type: String, required: true, unique: true },
  payload: { type: Schema.Types.Mixed, required: true },
  expiresAt: { type: Date, required: true, expires: 0 },
});

const ReportCache: mongoose.Model<ReportCacheProps> =
  mongoose.models.ReportCache ||
  mongoose.model<ReportCacheProps>("ReportCache", ReportCacheSchema);

export default ReportCache;

/** `load()` behind the cache; failures are not cached. */
export async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = await ReportCache.findOne({ key, expiresAt: { $gt: new Date() } }).lean();
  if (hit) return hit.payload as T;
  const payload = await load();
  await ReportCache.updateOne(
    { key },
    { $set: { payload, expiresAt: new Date(Date.now() + ttlMs) } },
    { upsert: true },
  ).catch(() => {});
  return payload;
}
