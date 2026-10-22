import LinkHealth, { type LinkHealthProps } from "@/models/LinkHealth";
import OutboundClick from "@/models/OutboundClick";
import { explain, hostOf, loadCampaignIndex, type CampaignIndex } from "./reasons";
import type { HealthItem, HealthReport, HealthSummaryRow, HealthTypeName } from "@/types/affiliateReport";

/**
 * The admin view of link health: counts per target type, what changed in the
 * last week, and every target that doesn't earn or is broken — ranked by how
 * often people click it. Callers must have connected.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const CHANGE_WINDOW_MS = 7 * DAY_MS;
const PROBLEM_LIMIT = 300;
const TYPES: HealthTypeName[] = ["card", "portal", "voucher"];

async function clicksByKey(): Promise<Map<string, number>> {
  const rows = await OutboundClick.aggregate<{ _id: { type: string; id: string | null }; n: number }>([
    { $match: { createdAt: { $gte: new Date(Date.now() - 30 * DAY_MS) }, type: { $in: TYPES } } },
    {
      $group: {
        _id: {
          type: "$type",
          id: { $cond: [{ $eq: ["$type", "card"] }, "$cardSlug", { $ifNull: ["$merchantSlug", "$targetId"] }] },
        },
        n: { $sum: 1 },
      },
    },
  ]);
  return new Map(rows.filter((r) => r._id.id).map((r) => [`${r._id.type}:${r._id.id}`, r.n]));
}

export function toItem(row: LinkHealthProps, clicks: Map<string, number>, index: CampaignIndex): HealthItem {
  const cur = row.current;
  const why = cur && !cur.affiliated ? explain(cur.step, cur.destination, index) : null;
  return {
    key: row.key,
    type: row.type,
    label: row.label,
    step: cur?.step ?? null,
    affiliated: cur?.affiliated ?? false,
    destinationHost: why?.host ?? hostOf(cur?.destination),
    pageStatus: row.page?.status ?? null,
    broken: row.broken,
    reason: row.broken ? "page_not_found" : (why?.reason ?? null),
    campaign: why?.campaign ?? null,
    clicks30d: clicks.get(row.key) ?? 0,
    lastChange: row.lastChange,
    lastChangeAt: row.lastChangeAt ? new Date(row.lastChangeAt).toISOString() : null,
    checkedAt: cur?.checkedAt ? new Date(cur.checkedAt).toISOString() : null,
  };
}

export async function buildHealthReport(): Promise<HealthReport> {
  const [rows, clicks, index] = await Promise.all([
    LinkHealth.find({}).lean<LinkHealthProps[]>(),
    clicksByKey(),
    loadCampaignIndex(),
  ]);

  const summary: HealthSummaryRow[] = TYPES.map((type) => {
    const mine = rows.filter((r) => r.type === type);
    const checked = mine.filter((r) => r.current);
    return {
      type,
      total: mine.length,
      earning: checked.filter((r) => r.current!.affiliated).length,
      notEarning: checked.filter((r) => !r.current!.affiliated).length,
      broken: mine.filter((r) => r.broken).length,
      unchecked: mine.length - checked.length,
    };
  });

  const checkedTimes = rows.flatMap((r) => (r.current ? [new Date(r.current.checkedAt).getTime()] : []));
  const allChecked = rows.length > 0 && checkedTimes.length === rows.length;

  const since = Date.now() - CHANGE_WINDOW_MS;
  const changes = rows
    .filter((r) => r.lastChangeAt && new Date(r.lastChangeAt).getTime() >= since)
    .map((r) => toItem(r, clicks, index))
    .sort((a, b) => (b.lastChangeAt ?? "").localeCompare(a.lastChangeAt ?? ""));

  const problems = rows
    .filter((r) => r.broken || (r.current && !r.current.affiliated))
    .map((r) => toItem(r, clicks, index))
    .sort((a, b) => b.clicks30d - a.clicks30d || Number(b.broken) - Number(a.broken) || a.label.localeCompare(b.label))
    .slice(0, PROBLEM_LIMIT);

  return {
    summary,
    allCheckedSince: allChecked ? new Date(Math.min(...checkedTimes)).toISOString() : null,
    changes,
    problems,
  };
}
