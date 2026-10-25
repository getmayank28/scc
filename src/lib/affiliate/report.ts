import type { Types } from "mongoose";
import OutboundClick from "@/models/OutboundClick";
import AffiliateTransaction from "@/models/AffiliateTransaction";
import Card from "@/models/Card";
import Bank from "@/models/Bank";
import Portal from "@/models/Portal";
import Giftor from "@/models/Giftor";
import Link from "@/models/Link";
import { explain, loadCampaignIndex, NEEDS_ACCESS } from "./reasons";
import type {
  AccessNeededRow,
  DayPoint,
  FunnelReport,
  FunnelRow,
  ReportRange,
  UnearnedRow,
} from "@/types/affiliateReport";

/**
 * Our side of the affiliate report: clicks from `OutboundClick` joined with
 * conversions from `AffiliateTransaction`, by day, surface, card and merchant,
 * plus the clicks that didn't earn and the Cuelinks campaigns we'd need access
 * to. Cuelinks itself can't produce this — it knows channels and campaigns,
 * not our cards, screens or users.
 *
 * Clicks are bucketed by click time, conversions by transaction date, both in
 * IST. Conversion rate and EPC divide one by the other over the same range, so
 * they're approximate near the range's start (a conversion may come from an
 * earlier click). Callers must have connected.
 */

const TZ = "Asia/Kolkata";
const IST_OFFSET_MS = 330 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const RANGE_DAYS: Record<ReportRange, number> = { "7d": 7, "30d": 30, "90d": 90 };

const CONFIRMED = ["validated", "payable", "invoice_raised", "paid"];
const NOT_EARNING_STEPS = ["direct", "bank_site", "internal"];

/** IST calendar day of `d`, as YYYY-MM-DD. */
export const istDay = (d: Date) => new Date(d.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);

export function rangeBounds(range: ReportRange): { from: Date; to: Date } {
  const now = Date.now();
  const startOfIstToday = Math.floor((now + IST_OFFSET_MS) / DAY_MS) * DAY_MS - IST_OFFSET_MS;
  return { from: new Date(startOfIstToday - (RANGE_DAYS[range] - 1) * DAY_MS), to: new Date(now) };
}

interface ClickBucket {
  _id: string | null;
  clicks: number;
  earning: number;
}
interface TxnBucket {
  _id: string | null;
  conversions: number;
  pending: number;
  confirmed: number;
  rejected: number;
  commissionConfirmed: number;
  commissionPending: number;
}

const clickGroup = (key: unknown) => ({
  $group: {
    _id: key,
    clicks: { $sum: 1 },
    earning: { $sum: { $cond: ["$affiliated", 1, 0] } },
  },
});

const txnGroup = (key: unknown) => ({
  $group: {
    _id: key,
    conversions: { $sum: 1 },
    pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
    confirmed: { $sum: { $cond: [{ $in: ["$status", CONFIRMED] }, 1, 0] } },
    rejected: { $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] } },
    commissionConfirmed: {
      $sum: { $cond: [{ $in: ["$status", CONFIRMED] }, { $ifNull: ["$commission", 0] }, 0] },
    },
    commissionPending: {
      $sum: { $cond: [{ $eq: ["$status", "pending"] }, { $ifNull: ["$commission", 0] }, 0] },
    },
  },
});

const round2 = (n: number) => Math.round(n * 100) / 100;

function mergeRows(
  clicks: ClickBucket[],
  txns: TxnBucket[],
  label: (key: string) => string,
): FunnelRow[] {
  const rows = new Map<string, FunnelRow>();
  const row = (k: string | null): FunnelRow => {
    const key = k ?? "(unattributed)";
    if (!rows.has(key)) {
      rows.set(key, {
        key,
        label: k ? label(k) : "(unattributed)",
        clicks: 0,
        earningClicks: 0,
        conversions: 0,
        pending: 0,
        confirmed: 0,
        rejected: 0,
        commissionConfirmed: 0,
        commissionPending: 0,
        cr: null,
        epc: null,
      });
    }
    return rows.get(key)!;
  };
  for (const c of clicks) {
    const r = row(c._id);
    r.clicks += c.clicks;
    r.earningClicks += c.earning;
  }
  for (const t of txns) {
    const r = row(t._id);
    r.conversions += t.conversions;
    r.pending += t.pending;
    r.confirmed += t.confirmed;
    r.rejected += t.rejected;
    r.commissionConfirmed += t.commissionConfirmed;
    r.commissionPending += t.commissionPending;
  }
  return [...rows.values()]
    .map((r) => ({
      ...r,
      commissionConfirmed: round2(r.commissionConfirmed),
      commissionPending: round2(r.commissionPending),
      cr: r.clicks ? round2((r.conversions / r.clicks) * 100) : null,
      epc: r.clicks ? round2(r.commissionConfirmed / r.clicks) : null,
    }))
    .sort((a, b) => b.commissionConfirmed + b.commissionPending - (a.commissionConfirmed + a.commissionPending) || b.clicks - a.clicks);
}

export async function buildFunnelReport(range: ReportRange): Promise<FunnelReport> {
  const { from, to } = rangeBounds(range);

  const [clickFacets] = await OutboundClick.aggregate([
    { $match: { createdAt: { $gte: from, $lte: to } } },
    {
      $facet: {
        total: [clickGroup(null)],
        byDay: [clickGroup({ $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: TZ } })],
        bySurface: [clickGroup("$surface")],
        byCard: [{ $match: { type: "card" } }, clickGroup("$cardSlug")],
        byMerchant: [
          { $match: { type: { $ne: "card" } } },
          clickGroup({ $ifNull: ["$merchantSlug", "$targetId"] }),
        ],
        byStep: [{ $group: { _id: "$step", clicks: { $sum: 1 } } }, { $sort: { clicks: -1 } }],
        unearned: [
          { $match: { step: { $in: NOT_EARNING_STEPS } } },
          { $sort: { createdAt: 1 } },
          {
            $group: {
              _id: {
                type: "$type",
                key: {
                  $cond: [
                    { $eq: ["$type", "card"] },
                    "$cardSlug",
                    { $ifNull: ["$merchantSlug", "$targetId"] },
                  ],
                },
              },
              clicks: { $sum: 1 },
              step: { $last: "$step" },
              destination: { $last: "$destination" },
            },
          },
          { $sort: { clicks: -1 } },
          { $limit: 50 },
        ],
      },
    },
  ]);

  const [txnFacets] = await AffiliateTransaction.aggregate([
    { $addFields: { day: { $ifNull: ["$transactionDate", "$createdAt"] } } },
    { $match: { day: { $gte: from, $lte: to } } },
    {
      $lookup: {
        from: "outboundclicks",
        localField: "clickId",
        foreignField: "_id",
        as: "click",
        pipeline: [{ $project: { merchantSlug: 1 } }],
      },
    },
    {
      $addFields: {
        merchantKey: {
          $ifNull: [{ $first: "$click.merchantSlug" }, "$targetId", "$campaignName"],
        },
      },
    },
    {
      $facet: {
        total: [txnGroup(null)],
        byDay: [txnGroup({ $dateToString: { format: "%Y-%m-%d", date: "$day", timezone: TZ } })],
        bySurface: [txnGroup("$surface")],
        byCard: [{ $match: { kind: "card_application" } }, txnGroup("$cardSlug")],
        byMerchant: [{ $match: { kind: "purchase" } }, txnGroup("$merchantKey")],
      },
    },
  ]);

  // ---- labels ------------------------------------------------------------
  const cardSlugs = new Set<string>();
  const merchantSlugs = new Set<string>();
  for (const b of [...clickFacets.byCard, ...txnFacets.byCard]) if (b._id) cardSlugs.add(b._id);
  for (const b of [...clickFacets.byMerchant, ...txnFacets.byMerchant]) if (b._id) merchantSlugs.add(b._id);
  for (const u of clickFacets.unearned) {
    if (!u._id.key) continue;
    (u._id.type === "card" ? cardSlugs : merchantSlugs).add(u._id.key);
  }

  const [cards, portals, giftors] = await Promise.all([
    Card.find({ slug: { $in: [...cardSlugs] } }, "slug name").lean<{ slug: string; name: string }[]>(),
    Portal.find({ slug: { $in: [...merchantSlugs] } }, "slug name").lean<{ slug: string; name: string }[]>(),
    Giftor.find({ slug: { $in: [...merchantSlugs] } }, "slug name").lean<{ slug: string; name: string }[]>(),
  ]);
  const cardName = new Map(cards.map((c) => [c.slug, c.name]));
  const merchantName = new Map([...giftors, ...portals].map((m) => [m.slug, m.name]));
  const cardLabel = (k: string) => cardName.get(k) ?? k;
  const merchantLabel = (k: string) => merchantName.get(k) ?? k;

  // ---- funnel --------------------------------------------------------------
  const [totals] = mergeRows(clickFacets.total, txnFacets.total, () => "All");
  const days = new Map<string, DayPoint>();
  for (let t = from.getTime(); t <= to.getTime(); t += DAY_MS) {
    const d = istDay(new Date(t));
    days.set(d, { date: d, clicks: 0, conversions: 0 });
  }
  for (const b of clickFacets.byDay as ClickBucket[]) if (b._id && days.has(b._id)) days.get(b._id)!.clicks = b.clicks;
  for (const b of txnFacets.byDay as TxnBucket[]) if (b._id && days.has(b._id)) days.get(b._id)!.conversions = b.conversions;

  // ---- unearned & access needed ---------------------------------------------
  const index = await loadCampaignIndex();
  const byId = index.byId;

  const unearned: UnearnedRow[] = clickFacets.unearned.map(
    (u: { _id: { type: UnearnedRow["type"]; key: string | null }; clicks: number; step: string; destination: string }) => {
      const key = u._id.key ?? "(unknown)";
      const { reason, host, campaign } = explain(u.step, u.destination, index);
      return {
        type: u._id.type,
        key,
        label: u._id.type === "card" ? cardLabel(key) : merchantLabel(key),
        clicks: u.clicks,
        destinationHost: host,
        reason,
        campaign,
      };
    },
  );

  // Campaigns we already route traffic to (portal mappings, link rows) or that
  // unearned clicks hit, which still need an access request.
  const [mappedPortals, campaignLinks] = await Promise.all([
    Portal.find({ status: "active", campaignId: { $ne: null } }, "name campaignId").lean<{ name: string; campaignId: number }[]>(),
    Link.find({ active: true, campaignId: { $ne: null } }, "campaignId cardId bankId").lean<{ campaignId: number; cardId?: Types.ObjectId; bankId?: Types.ObjectId }[]>(),
  ]);
  const linkCards = await Card.find(
    { _id: { $in: campaignLinks.flatMap((l) => (l.cardId ? [l.cardId] : [])) } },
    "name",
  ).lean<{ _id: unknown; name: string }[]>();
  const linkBanks = await Bank.find(
    { _id: { $in: campaignLinks.flatMap((l) => (l.bankId ? [l.bankId] : [])) } },
    "name",
  ).lean<{ _id: unknown; name: string }[]>();
  const nameById = new Map([...linkCards, ...linkBanks].map((d) => [String(d._id), d.name]));

  const access = new Map<number, AccessNeededRow>();
  const note = (id: number, usedBy: string | null, lost = 0) => {
    const c = byId.get(id);
    if (!c || !NEEDS_ACCESS.has(c.access_status)) return;
    const row =
      access.get(id) ??
      { campaignId: id, campaignName: c.name, status: c.access_status, payout: c.payout, payoutType: c.payout_type, usedBy: [], lostClicks: 0 };
    if (usedBy && !row.usedBy.includes(usedBy)) row.usedBy.push(usedBy);
    row.lostClicks += lost;
    access.set(id, row);
  };
  for (const p of mappedPortals) note(p.campaignId, p.name);
  for (const l of campaignLinks) {
    const owner = nameById.get(String(l.cardId ?? l.bankId));
    note(l.campaignId, owner ? (l.cardId ? owner : `${owner} (all cards)`) : null);
  }
  for (const u of unearned) if (u.campaign) note(u.campaign.id, u.label, u.clicks);

  return {
    range,
    from: from.toISOString(),
    to: to.toISOString(),
    totals: totals ?? mergeRows([{ _id: "All", clicks: 0, earning: 0 }], [], () => "All")[0],
    byDay: [...days.values()],
    bySurface: mergeRows(clickFacets.bySurface, txnFacets.bySurface, (k) => k),
    byCard: mergeRows(clickFacets.byCard, txnFacets.byCard, cardLabel),
    byMerchant: mergeRows(clickFacets.byMerchant, txnFacets.byMerchant, merchantLabel),
    byStep: clickFacets.byStep.map((s: { _id: string; clicks: number }) => ({ step: s._id, clicks: s.clicks })),
    unearned,
    accessNeeded: [...access.values()].sort((a, b) => b.lostClicks - a.lostClicks || b.usedBy.length - a.usedBy.length),
  };
}
