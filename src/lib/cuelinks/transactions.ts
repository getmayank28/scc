import { Types } from "mongoose";
import AffiliateTransaction, {
  TXN_STATUSES,
  type AffiliateTransactionProps,
  type TxnSource,
  type TxnStatus,
} from "@/models/AffiliateTransaction";
import OutboundClick, { type OutboundClickProps } from "@/models/OutboundClick";
import Link from "@/models/Link";
import type { ApiTransaction } from "./client";

/**
 * Turns Cuelinks transactions — from the Transaction Update webhook or the
 * `GET /transactions` sync — into `AffiliateTransaction` rows.
 *
 * Both sources are normalised to `TxnInput` first, then go through one upsert
 * so the ordering rules live in a single place:
 *   - webhook deliveries aren't ordered, so a webhook may only move a status
 *     forward (a late "pending" never overwrites "validated");
 *   - the sync carries Cuelinks' `updated_at`, so it is authoritative and
 *     overwrites anything older, in either direction.
 */

/** Cookie window used to infer the user when a campaign drops sub IDs (Axis: 30 days). */
const INFER_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// "rejected" ranks last: it is final, and may legitimately follow a validation
// (a lead reversed after review).
const RANK: Record<TxnStatus, number> = {
  pending: 1,
  validated: 2,
  payable: 3,
  invoice_raised: 4,
  paid: 5,
  rejected: 6,
};

// Sub IDs that don't identify a person: logged-out clicks and our own report runs.
const NOT_A_USER = new Set(["", "anon", "coverage-report", "health-check"]);

export interface TxnInput {
  cuelinksId: number;
  status: TxnStatus;
  campaignId: number | null;
  campaignName: string | null;
  campaignType: string | null;
  saleAmount: number | null;
  commission: number | null;
  currency: string | null;
  orderId: string | null;
  transactionDate: Date | null;
  /** subid … subid5, as sent on the click. */
  subids: [string | null, string | null, string | null, string | null, string | null];
  sourceUpdatedAt: Date | null;
  raw: Record<string, unknown>;
}

const str = (v: unknown): string | null => {
  const s = typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim();
  return s ? s : null;
};
const num = (v: unknown): number | null => {
  const s = str(v);
  if (s === null) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};
const date = (v: unknown): Date | null => {
  const s = str(v);
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
};

export function parseStatus(v: unknown): TxnStatus | null {
  const s = str(v)?.toLowerCase().replace(/\s+/g, "_");
  return s && (TXN_STATUSES as string[]).includes(s) ? (s as TxnStatus) : null;
}

/**
 * Webhook parameters. We map Cuelinks' macros to parameters of the same name
 * in the dashboard ({transaction_id} → transaction_id, {aff_sub} → aff_sub …),
 * so this reads macro names directly.
 */
export function fromWebhook(p: Record<string, string>): TxnInput | null {
  const cuelinksId = num(p.transaction_id);
  const status = parseStatus(p.status);
  if (!cuelinksId || !status) return null;
  return {
    cuelinksId,
    status,
    campaignId: num(p.campaign_id),
    campaignName: str(p.campaign_name),
    campaignType: str(p.campaign_type),
    saleAmount: num(p.sale_amount),
    commission: num(p.user_commission),
    currency: str(p.currency),
    orderId: str(p.transaction_reference_id),
    transactionDate: date(p.transaction_date) ?? date(p.transaction_timestamp),
    subids: [str(p.aff_sub), str(p.subid2), str(p.subid3), str(p.subid4), str(p.subid5)],
    sourceUpdatedAt: null,
    // Never persist the shared secret or the visitor's IP, even if mapped.
    raw: Object.fromEntries(
      Object.entries(p).filter(([k]) => k !== "secret" && k !== "ip_address"),
    ),
  };
}

export function fromApi(t: ApiTransaction): TxnInput | null {
  const status = parseStatus(t.status);
  if (!t.id || !status) return null;
  return {
    cuelinksId: t.id,
    status,
    campaignId: t.campaign_id ?? null,
    campaignName: str(t.campaign_name),
    campaignType: str(t.campaign_type),
    saleAmount: num(t.sale_amount),
    commission: num(t.user_commission),
    currency: str(t.currency),
    orderId: str(t.order_id) ?? str(t.merchant_reference_id),
    transactionDate: date(t.transaction_date),
    subids: [str(t.sub_id), str(t.sub_id_2), str(t.sub_id_3), str(t.sub_id_4), str(t.sub_id_5)],
    sourceUpdatedAt: date(t.updated_at),
    raw: t as Record<string, unknown>,
  };
}

type Existing = Pick<
  AffiliateTransactionProps,
  "status" | "sourceUpdatedAt" | "attribution"
>;

/** Whether `input` from `source` should replace what's stored. */
export function shouldApply(existing: Existing | null, input: TxnInput, source: TxnSource): boolean {
  if (!existing) return true;
  if (source === "sync") {
    if (!input.sourceUpdatedAt) return RANK[input.status] > RANK[existing.status];
    return !existing.sourceUpdatedAt || input.sourceUpdatedAt >= existing.sourceUpdatedAt;
  }
  return RANK[input.status] > RANK[existing.status];
}

interface Attribution {
  attribution: AffiliateTransactionProps["attribution"];
  userId: string | null;
  surface: string | null;
  targetId: string | null;
  cardSlug: string | null;
  device: string | null;
  clickId: Types.ObjectId | null;
  clickType: OutboundClickProps["type"] | null;
}

type ClickRow = Pick<
  OutboundClickProps,
  "userId" | "type" | "targetId" | "surface" | "cardSlug" | "device"
> & { _id: Types.ObjectId };

const CLICK_FIELDS = "_id userId type targetId surface cardSlug device";

/** The day of a transaction, inclusive: Cuelinks reports dates, not times. */
const endOfDay = (d: Date) => new Date(Math.floor(d.getTime() / DAY_MS) * DAY_MS + DAY_MS);

export async function attribute(input: TxnInput): Promise<Attribution> {
  const [sub1, sub2, sub3, sub4, sub5] = input.subids;
  const until = input.transactionDate ? endOfDay(input.transactionDate) : new Date();
  const userId = sub1 && !NOT_A_USER.has(sub1) ? sub1 : null;

  if (userId) {
    const target = sub3 ? { targetId: sub3 } : sub4 ? { cardSlug: sub4 } : {};
    const click = await OutboundClick.findOne(
      { userId, ...target, createdAt: { $lte: until } },
      CLICK_FIELDS,
    )
      .sort({ createdAt: -1 })
      .lean<ClickRow | null>();
    return {
      attribution: "subid",
      userId,
      surface: sub2,
      targetId: sub3,
      cardSlug: sub4,
      device: sub5,
      clickId: click?._id ?? null,
      clickType: click?.type ?? null,
    };
  }

  // No sub IDs came back (Axis doesn't pass them). If exactly one of our users
  // clicked this campaign inside its cookie window, it was them.
  if (input.campaignId) {
    const clicks = await OutboundClick.find(
      {
        campaignId: input.campaignId,
        userId: { $nin: [...NOT_A_USER] },
        createdAt: { $gte: new Date(until.getTime() - INFER_WINDOW_MS - DAY_MS), $lte: until },
      },
      CLICK_FIELDS,
    )
      .sort({ createdAt: -1 })
      .limit(500)
      .lean<ClickRow[]>();
    const users = new Set(clicks.map((c) => c.userId));
    if (users.size === 1) {
      const c = clicks[0];
      return {
        attribution: "inferred",
        userId: c.userId,
        surface: c.surface,
        targetId: c.type === "card" ? null : c.targetId,
        cardSlug: c.cardSlug ?? null,
        device: c.device,
        clickId: c._id,
        clickType: c.type,
      };
    }
  }

  return {
    attribution: "none",
    userId: null,
    surface: sub2,
    targetId: sub3,
    cardSlug: sub4,
    device: sub5,
    clickId: null,
    clickType: null,
  };
}

/** Null when this delivery says nothing about the kind (a bare status update). */
async function kindOf(
  input: TxnInput,
  a: Attribution,
): Promise<AffiliateTransactionProps["kind"] | null> {
  if (input.campaignType) return input.campaignType.toUpperCase() === "CPL" ? "card_application" : "purchase";
  if (a.clickType) return a.clickType === "card" ? "card_application" : "purchase";
  // A card click carries subid4 alone; portal and voucher clicks also set subid3.
  if (a.cardSlug && !a.targetId) return "card_application";
  // Webhooks don't carry the campaign type, and an unmatched row has no click,
  // so fall back to whether we route card applications to this campaign.
  if (input.campaignId) {
    const isCardCampaign =
      (await Link.exists({ campaignId: input.campaignId })) ||
      (await OutboundClick.exists({ campaignId: input.campaignId, type: "card" }));
    if (isCardCampaign) return "card_application";
    return "purchase";
  }
  return null;
}

const ATTRIBUTION_RANK: Record<AffiliateTransactionProps["attribution"], number> = {
  none: 0,
  inferred: 1,
  subid: 2,
};

/** Drops null/undefined values, so a partial delivery can't erase known fields. */
function withoutNulls<T extends Record<string, unknown>>(o: T): Partial<T> {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v != null)) as Partial<T>;
}

export type UpsertOutcome = "created" | "updated" | "ignored";

export async function upsertTransaction(
  input: TxnInput,
  source: TxnSource,
  retried = false,
): Promise<UpsertOutcome> {
  const existing = await AffiliateTransaction.findOne(
    { cuelinksId: input.cuelinksId },
    "status sourceUpdatedAt attribution",
  ).lean<Existing | null>();

  if (existing && !shouldApply(existing, input, source)) {
    // Stale status, but a later click log may now let us attribute it.
    if (existing.attribution !== "none") return "ignored";
    const a = await attribute(input);
    if (a.attribution === "none") return "ignored";
    const { clickType, ...fields } = a;
    void clickType;
    await AffiliateTransaction.updateOne({ cuelinksId: input.cuelinksId }, { $set: fields });
    return "updated";
  }

  const a = await attribute(input);
  const { clickType, ...attrFields } = a;
  void clickType;
  const fields = {
    status: input.status,
    kind: await kindOf(input, a),
    campaignId: input.campaignId,
    campaignName: input.campaignName,
    campaignType: input.campaignType,
    saleAmount: input.saleAmount,
    commission: input.commission,
    currency: input.currency,
    orderId: input.orderId,
    transactionDate: input.transactionDate,
    sourceUpdatedAt: input.sourceUpdatedAt,
    raw: input.raw,
  };
  const historyEntry = { status: input.status, at: new Date(), source };

  if (existing) {
    // Deliveries are often partial (a rejection may carry only id + status),
    // so only overwrite with values actually present, and never weaken how
    // the row was attributed.
    const keepAttribution = ATTRIBUTION_RANK[a.attribution] < ATTRIBUTION_RANK[existing.attribution];
    await AffiliateTransaction.updateOne(
      { cuelinksId: input.cuelinksId },
      {
        $set: {
          ...withoutNulls(fields),
          ...(keepAttribution ? {} : withoutNulls(attrFields)),
        },
        ...(existing.status !== input.status ? { $push: { statusHistory: historyEntry } } : {}),
      },
    );
    return "updated";
  }

  try {
    await AffiliateTransaction.create({
      cuelinksId: input.cuelinksId,
      ...fields,
      kind: fields.kind ?? "purchase",
      ...attrFields,
      statusHistory: [historyEntry],
    });
    return "created";
  } catch (err) {
    // Two deliveries for a new transaction raced; the loser re-runs as an update.
    if (!retried && (err as { code?: number }).code === 11000) {
      return upsertTransaction(input, source, true);
    }
    throw err;
  }
}
