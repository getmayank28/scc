"use client";

import dayjs from "dayjs";
import Typography from "@/components/Typography/Typography";
import { useGetAffiliateOverviewQuery } from "@/store/admin";

/**
 * Cuelinks conversions overview. Read-only; fuller reporting (EPC, conversion
 * rate by card) is Phase 4.
 */

interface Bucket {
  _id: string | null;
  count: number;
  commission: number;
}

interface Txn {
  _id: string;
  cuelinksId: number;
  status: string;
  kind?: string;
  campaignName: string | null;
  cardSlug?: string | null;
  surface?: string | null;
  userId?: string | null;
  attribution?: string;
  commission: number | null;
  transactionDate: string | null;
}

interface SyncRow {
  key: string;
  lastRunAt: string | null;
  cursor: string | null;
  lastResult: Record<string, unknown> | null;
}

interface Overview {
  byStatus: Bucket[];
  byKind: Bucket[];
  bySurface: Bucket[];
  byCampaign: Bucket[];
  byAttribution: Bucket[];
  recent: Txn[];
  unmatched: Txn[];
  clicks30d: { _id: { type: string; step: string }; count: number }[];
  sync: SyncRow[];
}

const SYNC_LABELS: Record<string, string> = {
  "cuelinks-transactions": "Daily sync",
  "cuelinks-webhook-transactions": "Transaction webhook",
  "cuelinks-webhook-campaigns": "Campaign webhook",
};

const inr = (n: number | null | undefined) =>
  n == null ? "—" : `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const when = (d: string | null | undefined) => (d ? dayjs(d).format("D MMM YYYY, HH:mm") : "never");

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-brown-sidebar border-2 border-brown-border p-4 min-w-xs">
      <Typography variant="caption" className="text-left opacity-100 text-sm font-semibold mb-2">
        {title}
      </Typography>
      {children}
    </div>
  );
}

function BucketTable({ rows, empty = "No data yet" }: { rows: Bucket[]; empty?: string }) {
  if (!rows.length) return <p className="text-sm text-white/50">{empty}</p>;
  return (
    <table className="w-full text-sm">
      <tbody>
        {rows.map((r) => (
          <tr key={String(r._id)} className="border-t border-white/5">
            <td className="py-1 pr-4 text-white/80">{r._id ?? "(none)"}</td>
            <td className="py-1 pr-4 text-right text-white">{r.count}</td>
            <td className="py-1 text-right text-white/70">{inr(r.commission)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TxnTable({ rows }: { rows: Txn[] }) {
  if (!rows.length) return <p className="text-sm text-white/50">None</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-white/50">
            <th className="py-1 pr-4 font-medium">Date</th>
            <th className="py-1 pr-4 font-medium">Campaign</th>
            <th className="py-1 pr-4 font-medium">Card</th>
            <th className="py-1 pr-4 font-medium">Surface</th>
            <th className="py-1 pr-4 font-medium">Status</th>
            <th className="py-1 pr-4 font-medium">Attribution</th>
            <th className="py-1 text-right font-medium">Commission</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t._id} className="border-t border-white/5 text-white/80">
              <td className="py-1 pr-4 whitespace-nowrap">
                {t.transactionDate ? dayjs(t.transactionDate).format("D MMM YYYY") : "—"}
              </td>
              <td className="py-1 pr-4">{t.campaignName ?? "—"}</td>
              <td className="py-1 pr-4">{t.cardSlug ?? "—"}</td>
              <td className="py-1 pr-4">{t.surface ?? "—"}</td>
              <td className="py-1 pr-4">{t.status}</td>
              <td className="py-1 pr-4">{t.attribution ?? "—"}</td>
              <td className="py-1 text-right">{inr(t.commission)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const AffiliateAdmin = () => {
  const { data, isLoading, isError } = useGetAffiliateOverviewQuery({});
  const o = data as Overview | undefined;

  if (isLoading) return <p className="p-10 text-white/60">Loading…</p>;
  if (isError || !o) return <p className="p-10 text-white/60">Couldn&apos;t load the affiliate overview.</p>;

  return (
    <div className="flex flex-col justify-start gap-4 p-10">
      <Typography variant="h4" className="text-left">
        Affiliate (Cuelinks)
      </Typography>

      <div className="flex gap-4 flex-wrap">
        <Panel title="Health">
          <table className="text-sm">
            <tbody>
              {Object.entries(SYNC_LABELS).map(([key, label]) => {
                const row = o.sync.find((s) => s.key === key);
                const failed = row?.lastResult && row.lastResult.ok === false;
                return (
                  <tr key={key}>
                    <td className="py-1 pr-4 text-white/80">{label}</td>
                    <td className={`py-1 ${failed ? "text-destructive" : "text-white"}`}>
                      {when(row?.lastRunAt)}
                      {failed ? " (failed)" : ""}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>
        <Panel title="By status">
          <BucketTable rows={o.byStatus} />
        </Panel>
        <Panel title="By kind">
          <BucketTable rows={o.byKind} />
        </Panel>
        <Panel title="By surface">
          <BucketTable rows={o.bySurface} />
        </Panel>
        <Panel title="By attribution">
          <BucketTable rows={o.byAttribution} />
        </Panel>
        <Panel title="Outbound clicks, last 30 days">
          {o.clicks30d.length ? (
            <table className="w-full text-sm">
              <tbody>
                {o.clicks30d.map((c) => (
                  <tr key={`${c._id.type}-${c._id.step}`} className="border-t border-white/5">
                    <td className="py-1 pr-4 text-white/80">{c._id.type}</td>
                    <td className="py-1 pr-4 text-white/60">{c._id.step}</td>
                    <td className="py-1 text-right text-white">{c.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-white/50">No clicks yet</p>
          )}
        </Panel>
      </div>

      <Panel title="Top campaigns">
        <BucketTable rows={o.byCampaign} />
      </Panel>
      <Panel title="Recent transactions">
        <TxnTable rows={o.recent} />
      </Panel>
      <Panel title="Unmatched (no user — mostly Axis, which drops sub IDs)">
        <TxnTable rows={o.unmatched} />
      </Panel>
    </div>
  );
};

export default AffiliateAdmin;
