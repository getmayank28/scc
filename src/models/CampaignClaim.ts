import mongoose, { Schema, Types } from "mongoose";

/**
 * One row per card application made through a campaign landing page (today
 * only `festive`), keyed on the Cuelinks transaction that reported it. The
 * claim follows that transaction — applied → approved → issued — and holds the
 * voucher we owe for it.
 *
 * Nothing here is user-editable: transitions come from the Cuelinks webhook /
 * sync (lib/campaign/claims.ts) and from an admin issuing the voucher.
 *
 * One approved card per bank: `bankLock` is set to the bank while a claim is
 * approved or issued, and a unique index on it rejects a second one, which is
 * then marked `duplicate_bank` instead.
 */

export type ClaimStatus = "applied" | "approved" | "issued" | "rejected" | "duplicate_bank";

export const CLAIM_STATUSES: ClaimStatus[] = [
  "applied",
  "approved",
  "issued",
  "rejected",
  "duplicate_bank",
];

/** WhatsApp messages a claim can send, each at most once (see lib/campaign/notify.ts). */
export type ClaimMessageKey =
  | "received"
  | "approved"
  | "voucher_ready"
  | "reveal_reminder"
  | "rejected";

export interface ClaimNotification {
  sentAt: Date;
  attempts?: number;
  waMessageId?: Types.ObjectId;
  /** The send failed; the daily job retries it. */
  failed?: boolean;
  /** Deliberately not sent (no consent, no phone, template not configured). */
  skipped?: string;
}

export interface ClaimVoucher {
  brand: string;
  amount: number;
  codeEnc: string;
  pinEnc: string | null;
  expiry: Date | null;
  issuedBy: string;
  revealedAt: Date | null;
  lastRevealedAt: Date | null;
  revealCount: number;
  /** The user marked it used. We can't see redemption at the brand, so this is self-reported. */
  usedAt: Date | null;
}

export interface CampaignClaimProps {
  userId: string;
  campaign: string;
  cardSlug: string;
  bank: string;
  /** Voucher value owed, in rupees, fixed when the claim is created. */
  amount: number;

  cuelinksId: number;
  clickId: Types.ObjectId | null;
  matchType: "subid" | "inferred";

  status: ClaimStatus;
  bankLock: string | null;
  appliedAt: Date;
  approvedAt: Date | null;
  issuedAt: Date | null;
  rejectedAt: Date | null;

  voucher: ClaimVoucher | null;
  notifications: Partial<Record<ClaimMessageKey, ClaimNotification>>;
  /** Reasons an admin should look at this claim before issuing. */
  flags: string[];

  createdAt: Date;
  updatedAt: Date;
}

const VoucherSchema = new Schema<ClaimVoucher>(
  {
    brand: { type: String, required: true },
    amount: { type: Number, required: true },
    codeEnc: { type: String, required: true },
    pinEnc: { type: String, default: null },
    expiry: { type: Date, default: null },
    issuedBy: { type: String, required: true },
    revealedAt: { type: Date, default: null },
    lastRevealedAt: { type: Date, default: null },
    revealCount: { type: Number, default: 0 },
    usedAt: { type: Date, default: null },
  },
  { _id: false },
);

const CampaignClaimSchema = new Schema<CampaignClaimProps>(
  {
    userId: { type: String, required: true, index: true },
    campaign: { type: String, required: true },
    cardSlug: { type: String, required: true },
    bank: { type: String, required: true },
    amount: { type: Number, required: true },

    cuelinksId: { type: Number, required: true, unique: true },
    clickId: { type: Schema.Types.ObjectId, ref: "OutboundClick", default: null },
    matchType: { type: String, enum: ["subid", "inferred"], required: true },

    status: { type: String, enum: CLAIM_STATUSES, required: true, index: true },
    bankLock: { type: String, default: null },
    appliedAt: { type: Date, required: true },
    approvedAt: { type: Date, default: null },
    issuedAt: { type: Date, default: null },
    rejectedAt: { type: Date, default: null },

    voucher: { type: VoucherSchema, default: null },
    // Keys are ClaimMessageKey; Mixed so `notifications.<key>` can be set and
    // tested for existence atomically.
    notifications: { type: Schema.Types.Mixed, default: {} },
    flags: { type: [String], default: [] },
  },
  { timestamps: true, minimize: false },
);

CampaignClaimSchema.index(
  { userId: 1, campaign: 1, bankLock: 1 },
  { unique: true, partialFilterExpression: { bankLock: { $type: "string" } } },
);
CampaignClaimSchema.index({ campaign: 1, status: 1, approvedAt: 1 });

export default (mongoose.models.CampaignClaim as mongoose.Model<CampaignClaimProps>) ||
  mongoose.model<CampaignClaimProps>("CampaignClaim", CampaignClaimSchema);
