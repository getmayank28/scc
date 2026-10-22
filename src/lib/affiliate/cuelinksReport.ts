import AffiliateTransaction from "@/models/AffiliateTransaction";
import { cached } from "@/models/ReportCache";
import { getApi } from "@/lib/cuelinks/client";
import { istDay, rangeBounds } from "./report";
import type { CuelinksReport, Reconciliation, ReportRange } from "@/types/affiliateReport";

/**
 * Cuelinks' own numbers for the admin tab — the performance, campaign,
 * earnings and unmonetized-traffic reports — plus a reconciliation of their
 * conversion totals against ours. Each report is cached for an hour and loads
 * independently: one failing shows as an error, not as zeros.
 */

const TTL_MS = 60 * 60 * 1000;
const EARNINGS_MONTHS = 6;

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const get = <T,>(path: string, params: Record<string, string | number>) =>
  cached(`cl:${path}:${JSON.stringify(params)}`, TTL_MS, () => getApi<T>(path, params));

interface PerfBody {
  data: { date: string; clicks: number; transactions: number; commission: string }[];
  totals: { clicks: number; transactions: number; commission: string; epc: string };
}
interface CampaignsBody {
  data: {
    campaign_name: string;
    channel_name: string;
    clicks: number;
    transactions: number;
    commission: string;
    epc: string;
  }[];
}
interface EarningsBody {
  data: {
    month: string;
    pending: string;
    validated: string;
    payable: string;
    claimed: string;
    rejected: string;
  }[];
}
interface UnmonetizedBody {
  data: { domain_name: string; clicks: number; status: string }[];
}

/**
 * Flags a gap above 10% or 2 transactions, whichever is larger. Commission is
 * also checked, at 10% but never below ₹500, so a couple of small orders don't
 * override the 2-transaction allowance; it catches amounts drifting while the
 * counts agree.
 */
export function reconcile(
  ours: Reconciliation["ours"],
  theirs: Reconciliation["cuelinks"],
): Reconciliation {
  const countGap = Math.abs(ours.transactions - theirs.transactions);
  const countLimit = Math.max(2, 0.1 * Math.max(ours.transactions, theirs.transactions));
  const moneyBase = Math.max(ours.commission, theirs.commission);
  const moneyGap = Math.abs(ours.commission - theirs.commission);
  return {
    ours,
    cuelinks: theirs,
    mismatch: countGap > countLimit || moneyGap > Math.max(500, 0.1 * moneyBase),
  };
}

export async function buildCuelinksReport(range: ReportRange): Promise<CuelinksReport> {
  const { from, to } = rangeBounds(range);
  const window = { start_date: istDay(from), end_date: istDay(to) };
  const errors: string[] = [];
  const attempt = async <T,>(name: string, fn: () => Promise<T>): Promise<T | null> => {
    try {
      return await fn();
    } catch (err) {
      console.error(`[cuelinks report] ${name} failed`, err);
      errors.push(name);
      return null;
    }
  };

  const earningsFrom = new Date(to);
  earningsFrom.setUTCMonth(earningsFrom.getUTCMonth() - (EARNINGS_MONTHS - 1));

  const [perf, camps, earnings, unmon, ours] = await Promise.all([
    attempt("performance", () => get<PerfBody>("/reports/performance", { ...window, per_page: 100 })),
    attempt("campaigns", () =>
      get<CampaignsBody>("/reports/campaigns", { ...window, sort: "commission", order: "desc", per_page: 20 }),
    ),
    attempt("earnings", () =>
      get<EarningsBody>("/reports/earnings", {
        start_date: istDay(earningsFrom),
        end_date: window.end_date,
        per_page: EARNINGS_MONTHS,
      }),
    ),
    attempt("unmonetized traffic", () =>
      get<UnmonetizedBody>("/reports/unmonetized_traffic", { ...window, per_page: 20 }),
    ),
    AffiliateTransaction.aggregate([
      { $addFields: { day: { $ifNull: ["$transactionDate", "$createdAt"] } } },
      { $match: { day: { $gte: from, $lte: to } } },
      { $group: { _id: null, n: { $sum: 1 }, commission: { $sum: { $ifNull: ["$commission", 0] } } } },
    ]),
  ]);

  const performance = perf
    ? {
        totals: {
          clicks: num(perf.totals?.clicks),
          transactions: num(perf.totals?.transactions),
          commission: num(perf.totals?.commission),
          epc: num(perf.totals?.epc),
        },
        byDay: (perf.data ?? [])
          .map((d) => ({
            date: d.date,
            clicks: num(d.clicks),
            transactions: num(d.transactions),
            commission: num(d.commission),
          }))
          .sort((a, b) => a.date.localeCompare(b.date)),
      }
    : null;

  return {
    performance,
    campaigns:
      camps?.data.map((c) => ({
        campaignName: c.campaign_name,
        channelName: c.channel_name,
        clicks: num(c.clicks),
        transactions: num(c.transactions),
        commission: num(c.commission),
        epc: num(c.epc),
      })) ?? null,
    earnings:
      earnings?.data.map((e) => ({
        month: e.month,
        pending: num(e.pending),
        validated: num(e.validated),
        payable: num(e.payable),
        claimed: num(e.claimed),
        rejected: num(e.rejected),
      })) ?? null,
    unmonetized:
      unmon?.data.map((u) => ({ domain: u.domain_name, clicks: num(u.clicks), status: u.status })) ?? null,
    reconciliation: performance
      ? reconcile(
          {
            transactions: ours[0]?.n ?? 0,
            commission: Math.round((ours[0]?.commission ?? 0) * 100) / 100,
          },
          {
            transactions: performance.totals.transactions,
            commission: performance.totals.commission,
          },
        )
      : null,
    errors,
  };
}
