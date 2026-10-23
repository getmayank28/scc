import mongoose, { Schema } from "mongoose";

/**
 * One row per Cuelinks transaction (a sale or a card-application lead),
 * keyed on Cuelinks' own transaction id so webhook retries and the nightly
 * sync update the same row.
 *
 * Who it belongs to comes from the sub IDs `/api/out` attached to the click
 * (subid = userId, subid2 = surface, subid3 = portal/voucher slug, subid4 =
 * card slug, subid5 = device). `attribution` says how confident that is:
 * `subid` is exact; `inferred` means the campaign doesn't pass sub IDs back
 * (Axis) and exactly one of our users clicked it inside its cookie window;
 * `none` means we couldn't tell.
 */

export type TxnStatus =
  | "pending"
  | "validated"
  | "payable"
  | "invoice_raised"
  | "paid"
  | "rejected";

export const TXN_STATUSES: TxnStatus[] = [
  "pending",
  "validated",
  "payable",
  "invoice_raised",
  "paid",
  "rejected",
];

export type TxnSource = "webhook" | "sync";

export interface AffiliateTransactionProps {
  cuelinksId: number;
  status: TxnStatus;
  statusHistory: { status: TxnStatus; at: Date; source: TxnSource }[];
  kind: "card_application" | "purchase";

  campaignId: number | null;
  campaignName: string | null;
  campaignType: string | null;
  saleAmount: number | null;
  commission: number | null;
  currency: string | null;
  orderId: string | null;
  transactionDate: Date | null;

  userId: string | null;
  surface: string | null;
  targetId: string | null;
  cardSlug: string | null;
  device: string | null;
  attribution: "subid" | "inferred" | "none";
  clickId: mongoose.Types.ObjectId | null;

  // Cuelinks' `updated_at`, only known from the sync API. Lets the sync, which
  // is authoritative, overwrite whatever an earlier webhook wrote.
  sourceUpdatedAt: Date | null;
  raw: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const AffiliateTransactionSchema = new Schema<AffiliateTransactionProps>(
  {
    cuelinksId: { type: Number, required: true, unique: true },
    status: { type: String, enum: TXN_STATUSES, required: true, index: true },
    statusHistory: [
      {
        _id: false,
        status: { type: String, enum: TXN_STATUSES, required: true },
        at: { type: Date, required: true },
        source: { type: String, enum: ["webhook", "sync"], required: true },
      },
    ],
    kind: { type: String, enum: ["card_application", "purchase"], required: true },

    campaignId: { type: Number, default: null, index: true },
    campaignName: { type: String, default: null },
    campaignType: { type: String, default: null },
    saleAmount: { type: Number, default: null },
    commission: { type: Number, default: null },
    currency: { type: String, default: null },
    orderId: { type: String, default: null },
    transactionDate: { type: Date, default: null },

    userId: { type: String, default: null, index: true },
    surface: { type: String, default: null },
    targetId: { type: String, default: null },
    cardSlug: { type: String, default: null },
    device: { type: String, default: null },
    attribution: { type: String, enum: ["subid", "inferred", "none"], required: true },
    clickId: { type: Schema.Types.ObjectId, ref: "OutboundClick", default: null },

    sourceUpdatedAt: { type: Date, default: null },
    raw: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, minimize: false },
);

AffiliateTransactionSchema.index({ userId: 1, transactionDate: -1 });

export default mongoose.models.AffiliateTransaction ||
  mongoose.model<AffiliateTransactionProps>(
    "AffiliateTransaction",
    AffiliateTransactionSchema,
  );
