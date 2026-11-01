import type { Types } from "mongoose";
import AffiliateTransaction, { type AffiliateTransactionProps } from "@/models/AffiliateTransaction";
import CampaignClaim, { type CampaignClaimProps } from "@/models/CampaignClaim";
import OutboundClick from "@/models/OutboundClick";
import SyncState, { SYNC_KEYS } from "@/models/SyncState";
import User from "@/models/User";
import WhatsAppMessage from "@/models/WhatsAppMessage";
import { voucherKeyConfigured } from "@/lib/crypto/voucher";
import { CARDS } from "@/app/credit-card-offers/_data/festive";
import type {
  AdminClaimDetail,
  AdminClaimRow,
  CampaignAdminReport,
  CampaignRange,
  ClaimTimelineEvent,
  FunnelRow,
  ReviewTxnRow,
} from "@/types/rewards";
import { CAMPAIGN_SURFACE, FESTIVE, FESTIVE_SLUGS, HDFC_CAMPAIGN_IDS, festiveCard } from "./festive";
import { CLAIM_MESSAGE_KEYS, CLAIM_TEMPLATES } from "./notify";

/**
 * Admin view of the festive campaign: funnel, the voucher queue (48h clock),
 * claims and transactions that need a human, money and health. Page views and
 * sign-ins live in Amplitude; this is what the database knows.
 */

const DAY = 864e5;
const WEBHOOK_STALE_MS = DAY;
const VOUCHER_SLA_HOURS = 48;

type ClaimDoc = CampaignClaimProps & { _id: Types.ObjectId };
type UserLite = { _id: Types.ObjectId; phoneNumber?: string; name?: string };

const iso = (d: Date | null | undefined) => (d ? new Date(d).toISOString() : null);

export function sinceFor(range: CampaignRange): Date {
  const days = { "7d": 7, "30d": 30, "90d": 90, all: 3650 }[range];
  return new Date(Date.now() - days * DAY);
}

async function usersById(ids: (string | null | undefined)[]): Promise<Map<string, UserLite>> {
  const uniq = [...new Set(ids.filter((i): i is string => !!i && /^[0-9a-f]{24}$/i.test(i)))];
  if (!uniq.length) return new Map();
  const rows = await User.find({ _id: { $in: uniq } }, "phoneNumber name").lean<UserLite[]>();
  return new Map(rows.map((u) => [String(u._id), u]));
}

function toRow(c: ClaimDoc, users: Map<string, UserLite>): AdminClaimRow {
  const u = users.get(c.userId);
  const hoursLeft =
    c.status === "approved" && c.approvedAt
      ? Math.round(VOUCHER_SLA_HOURS - (Date.now() - new Date(c.approvedAt).getTime()) / 36e5)
      : null;
  return {
    id: String(c._id),
    userId: c.userId,
    phone: u?.phoneNumber ?? null,
    name: u?.name ?? null,
    cardSlug: c.cardSlug,
    cardName: festiveCard(c.cardSlug)?.name ?? c.cardSlug,
    bank: c.bank,
    amount: c.amount,
    status: c.status,
    matchType: c.matchType,
    cuelinksId: c.cuelinksId,
    appliedAt: iso(c.appliedAt)!,
    approvedAt: iso(c.approvedAt),
    issuedAt: iso(c.issuedAt),
    revealedAt: iso(c.voucher?.revealedAt),
    hoursLeft,
    flags: c.flags ?? [],
  };
}

type TxnLite = Pick<
  AffiliateTransactionProps,
  "cuelinksId" | "status" | "campaignName" | "campaignId" | "cardSlug" | "surface" | "userId" | "attribution" | "transactionDate"
>;
const TXN_FIELDS = "cuelinksId status campaignName campaignId cardSlug surface userId attribution transactionDate";

function toTxnRow(t: TxnLite, users: Map<string, UserLite>): ReviewTxnRow {
  return {
    cuelinksId: t.cuelinksId,
    status: t.status,
    campaignName: t.campaignName,
    campaignId: t.campaignId,
    cardSlug: t.cardSlug,
    surface: t.surface,
    userId: t.userId,
    phone: t.userId ? (users.get(t.userId)?.phoneNumber ?? null) : null,
    attribution: t.attribution,
    transactionDate: iso(t.transactionDate),
  };
}

export async function buildCampaignReport(range: CampaignRange): Promise<CampaignAdminReport> {
  const since = sinceFor(range);
  const LIMIT = 100;

  const [clicks, rangeClaims, queueDocs, flaggedDocs, hdfc, unmatched, otherSurface, allOpen, webhook, sync] =
    await Promise.all([
      OutboundClick.aggregate<{ _id: string; n: number }>([
        {
          $match: {
            surface: CAMPAIGN_SURFACE,
            type: "card",
            targetId: { $in: FESTIVE_SLUGS },
            createdAt: { $gte: since },
          },
        },
        { $group: { _id: "$targetId", n: { $sum: 1 } } },
      ]),
      CampaignClaim.find({ campaign: FESTIVE, appliedAt: { $gte: since } }, "-voucher.codeEnc -voucher.pinEnc").lean<ClaimDoc[]>(),
      CampaignClaim.find({ campaign: FESTIVE, status: "approved" }, "-voucher.codeEnc -voucher.pinEnc")
        .sort({ approvedAt: 1 })
        .lean<ClaimDoc[]>(),
      CampaignClaim.find(
        {
          campaign: FESTIVE,
          flags: { $ne: [] },
          $or: [{ status: { $in: ["applied", "approved"] } }, { flags: "clawback" }],
        },
        "-voucher.codeEnc -voucher.pinEnc",
      )
        .sort({ appliedAt: -1 })
        .limit(LIMIT)
        .lean<ClaimDoc[]>(),
      AffiliateTransaction.find(
        { kind: "card_application", campaignId: { $in: HDFC_CAMPAIGN_IDS }, cardSlug: null, createdAt: { $gte: since } },
        TXN_FIELDS,
      )
        .sort({ createdAt: -1 })
        .limit(LIMIT)
        .lean<TxnLite[]>(),
      AffiliateTransaction.find(
        { kind: "card_application", attribution: "none", createdAt: { $gte: since } },
        TXN_FIELDS,
      )
        .sort({ createdAt: -1 })
        .limit(LIMIT)
        .lean<TxnLite[]>(),
      AffiliateTransaction.find(
        {
          kind: "card_application",
          cardSlug: { $in: FESTIVE_SLUGS },
          surface: { $ne: CAMPAIGN_SURFACE },
          createdAt: { $gte: since },
        },
        TXN_FIELDS,
      )
        .sort({ createdAt: -1 })
        .limit(LIMIT)
        .lean<TxnLite[]>(),
      CampaignClaim.find(
        { campaign: FESTIVE, status: { $in: ["approved", "issued"] } },
        "status amount cuelinksId flags voucher.revealedAt",
      ).lean<ClaimDoc[]>(),
      SyncState.findOne({ key: SYNC_KEYS.txnWebhook }, "lastRunAt").lean<{ lastRunAt: Date | null } | null>(),
      SyncState.findOne({ key: SYNC_KEYS.transactions }, "lastRunAt").lean<{ lastRunAt: Date | null } | null>(),
    ]);

  // ---- funnel, per card plus a total row ----
  const clicksBySlug = new Map(clicks.map((c) => [c._id, c.n]));
  const funnelFor = (key: string, label: string, claims: ClaimDoc[], applyClicks: number): FunnelRow => ({
    key,
    label,
    applyClicks,
    applied: claims.length,
    approved: claims.filter((c) => c.approvedAt && (c.status === "approved" || c.status === "issued")).length,
    issued: claims.filter((c) => c.status === "issued").length,
    revealed: claims.filter((c) => c.voucher?.revealedAt).length,
    rejected: claims.filter((c) => c.status === "rejected").length,
  });
  const funnel: FunnelRow[] = [
    funnelFor("all", "All cards", rangeClaims, clicks.reduce((s, c) => s + c.n, 0)),
    ...CARDS.map((card) =>
      funnelFor(
        card.slug,
        card.name,
        rangeClaims.filter((c) => c.cardSlug === card.slug),
        clicksBySlug.get(card.slug) ?? 0,
      ),
    ),
  ];

  // ---- money (all time) ----
  const sum = (rows: ClaimDoc[]) => rows.reduce((s, c) => s + (c.amount ?? 0), 0);
  const issuedRows = allOpen.filter((c) => c.status === "issued");
  const commissionAgg = await AffiliateTransaction.aggregate<{ total: number }>([
    { $match: { cuelinksId: { $in: allOpen.map((c) => c.cuelinksId) } } },
    { $group: { _id: null, total: { $sum: { $ifNull: ["$commission", 0] } } } },
  ]);

  const users = await usersById([
    ...queueDocs.map((c) => c.userId),
    ...flaggedDocs.map((c) => c.userId),
    ...[...hdfc, ...unmatched, ...otherSurface].map((t) => t.userId),
  ]);

  const lastWebhookAt = webhook?.lastRunAt ?? null;
  return {
    range,
    funnel,
    queue: queueDocs.map((c) => toRow(c, users)),
    review: {
      flagged: flaggedDocs.map((c) => toRow(c, users)),
      hdfcNoSubid: hdfc.map((t) => toTxnRow(t, users)),
      unmatched: unmatched.map((t) => toTxnRow(t, users)),
      otherSurface: otherSurface.map((t) => toTxnRow(t, users)),
    },
    money: {
      liability: sum(allOpen.filter((c) => c.status === "approved")),
      issued: sum(issuedRows),
      revealed: sum(issuedRows.filter((c) => c.voucher?.revealedAt)),
      writeOffs: sum(issuedRows.filter((c) => c.flags?.includes("clawback"))),
      commission: commissionAgg[0]?.total ?? 0,
    },
    health: {
      lastWebhookAt: iso(lastWebhookAt),
      webhookStale: !lastWebhookAt || Date.now() - new Date(lastWebhookAt).getTime() > WEBHOOK_STALE_MS,
      lastSyncAt: iso(sync?.lastRunAt),
      voucherKeyConfigured: voucherKeyConfigured(),
      templatesConfigured: Object.fromEntries(
        CLAIM_MESSAGE_KEYS.map((k) => [k, !!process.env[CLAIM_TEMPLATES[k].env]?.trim()]),
      ),
    },
  };
}

/** Every claim for a phone number, each with its full timeline. */
export async function claimsByPhone(phone: string): Promise<AdminClaimDetail[]> {
  const digits = phone.replace(/\D/g, "").slice(-10);
  const user = await User.findOne({ phoneNumber: digits }, "phoneNumber name").lean<UserLite | null>();
  if (!user) return [];
  const claims = await CampaignClaim.find({ userId: String(user._id) }, "-voucher.codeEnc -voucher.pinEnc")
    .sort({ appliedAt: -1 })
    .lean<ClaimDoc[]>();
  const users = new Map([[String(user._id), user]]);

  const templateKey = new Map(
    CLAIM_MESSAGE_KEYS.map((k) => [process.env[CLAIM_TEMPLATES[k].env]?.trim(), k] as const).filter(
      ([id]) => !!id,
    ),
  );

  return Promise.all(
    claims.map(async (c) => {
      const [click, txn, messages] = await Promise.all([
        c.clickId
          ? OutboundClick.findById(c.clickId, "createdAt step device").lean<{
              createdAt: Date;
              step: string;
              device: string;
            } | null>()
          : null,
        AffiliateTransaction.findOne({ cuelinksId: c.cuelinksId }, "statusHistory").lean<Pick<
          AffiliateTransactionProps,
          "statusHistory"
        > | null>(),
        WhatsAppMessage.find({ claimId: c._id }, "createdAt templateId status errorReason")
          .sort({ createdAt: 1 })
          .lean<{ createdAt: Date; templateId?: string; status: string; errorReason?: string }[]>(),
      ]);

      const timeline: ClaimTimelineEvent[] = [];
      if (click) timeline.push({ at: iso(click.createdAt)!, label: "Apply click", detail: `${click.step} · ${click.device}` });
      for (const h of txn?.statusHistory ?? []) {
        timeline.push({ at: iso(h.at)!, label: `Cuelinks: ${h.status}`, detail: h.source });
      }
      if (c.approvedAt) timeline.push({ at: iso(c.approvedAt)!, label: "Claim approved" });
      if (c.rejectedAt) timeline.push({ at: iso(c.rejectedAt)!, label: "Claim rejected" });
      if (c.issuedAt) timeline.push({ at: iso(c.issuedAt)!, label: "Voucher issued", detail: c.voucher?.issuedBy });
      if (c.voucher?.revealedAt) {
        timeline.push({
          at: iso(c.voucher.revealedAt)!,
          label: "Voucher revealed",
          detail: `${c.voucher.revealCount} view(s)`,
        });
      }
      for (const m of messages) {
        timeline.push({
          at: iso(m.createdAt)!,
          label: `WhatsApp: ${(m.templateId && templateKey.get(m.templateId)) || m.templateId || "message"}`,
          detail: m.errorReason ? `${m.status} — ${m.errorReason}` : m.status,
        });
      }
      timeline.sort((a, b) => a.at.localeCompare(b.at));
      return { ...toRow(c, users), timeline };
    }),
  );
}
