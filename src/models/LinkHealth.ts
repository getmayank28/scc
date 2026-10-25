import mongoose, { Schema } from "mongoose";
import type { OutboundStep } from "./OutboundClick";

/**
 * Daily health of every outbound target — each card, active portal and
 * voucher partner — as `/api/out` would resolve it right now, without anyone
 * having to click. One row per target (`key` = "<type>:<id>"), holding the
 * latest check, the one before, and what changed between them.
 *
 * Two independent questions:
 *   - does it earn? (`current`, checked daily-ish; see src/lib/affiliate/health.ts)
 *   - is the page alive? (`page`, checked weekly, only for real merchant/bank
 *     pages — never an affiliate link, which would register a fake click)
 */

export type HealthType = "card" | "portal" | "voucher";
export type PageStatus = "ok" | "not_found" | "error" | "blocked" | "skipped";
export type HealthChange =
  | "stopped_earning"
  | "started_earning"
  | "downgraded"
  | "upgraded"
  | "broke"
  | "recovered";

export interface HealthCheck {
  step: OutboundStep;
  affiliated: boolean;
  campaignId: number | null;
  destination: string;
  checkedAt: Date;
}

export interface LinkHealthProps {
  key: string;
  type: HealthType;
  targetId: string;
  label: string;
  current: HealthCheck | null;
  previous: HealthCheck | null;
  page: {
    status: PageStatus;
    httpStatus: number | null;
    url: string | null;
    checkedAt: Date;
    consecutiveErrors: number;
  } | null;
  /** A missing page (404/410), or a page erroring on two checks in a row. "blocked" never counts. */
  broken: boolean;
  lastChange: HealthChange | null;
  lastChangeAt: Date | null;
  /** Earliest time the scheduler should look at this row again; null = now. */
  dueAt: Date | null;
}

const CheckSchema = new Schema<HealthCheck>(
  {
    step: { type: String, required: true },
    affiliated: { type: Boolean, required: true },
    campaignId: { type: Number, default: null },
    destination: { type: String, required: true },
    checkedAt: { type: Date, required: true },
  },
  { _id: false },
);

const LinkHealthSchema = new Schema<LinkHealthProps>(
  {
    key: { type: String, required: true, unique: true },
    type: { type: String, enum: ["card", "portal", "voucher"], required: true, index: true },
    targetId: { type: String, required: true },
    label: { type: String, required: true },
    current: { type: CheckSchema, default: null },
    previous: { type: CheckSchema, default: null },
    page: {
      type: new Schema(
        {
          status: { type: String, enum: ["ok", "not_found", "error", "blocked", "skipped"], required: true },
          httpStatus: { type: Number, default: null },
          url: { type: String, default: null },
          checkedAt: { type: Date, required: true },
          consecutiveErrors: { type: Number, default: 0 },
        },
        { _id: false },
      ),
      default: null,
    },
    broken: { type: Boolean, default: false, index: true },
    lastChange: {
      type: String,
      enum: ["stopped_earning", "started_earning", "downgraded", "upgraded", "broke", "recovered"],
      default: null,
    },
    lastChangeAt: { type: Date, default: null, index: true },
    dueAt: { type: Date, default: null, index: true },
  },
  { timestamps: true },
);

LinkHealthSchema.index({ "current.campaignId": 1 });

const LinkHealth: mongoose.Model<LinkHealthProps> =
  mongoose.models.LinkHealth || mongoose.model<LinkHealthProps>("LinkHealth", LinkHealthSchema);

export default LinkHealth;
