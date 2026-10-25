"use client";

import dayjs from "dayjs";
import Typography from "@/components/Typography/Typography";
import { useState } from "react";
import {
  useGetAffiliateCuelinksQuery,
  useGetAffiliateOverviewQuery,
  useGetAffiliateReportQuery,
} from "@/store/admin";
import type { ReportRange } from "@/types/affiliateReport";
import {
  AccessTable,
  CuelinksPanel,
  FunnelTable,
  KpiRow,
  Section,
  StepTable,
  Trend,
  UnearnedTable,
} from "./ReportSections";
import { HealthSection } from "./HealthSection";

/**
 * Cuelinks affiliate report: our funnel for a chosen range (headline numbers,
 * trend, by surface/card/merchant, unearned clicks, campaigns needing access),
 * Cuelinks' own reports with a reconciliation, then health and transactions.
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
  "cuelinks-offers": "Offers refresh",
  "link-health": "Link health check",
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

const RANGES: { value: ReportRange; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
];

/** Health, lifetime totals and recent/unmatched transactions — not range-bound. */
function Activity() {
  const { data, isLoading, isError } = useGetAffiliateOverviewQuery({});
  const o = data as Overview | undefined;
  if (isLoading) return <p className="text-white/60">Loading activity…</p>;
  if (isError || !o) return <p className="text-white/60">Couldn&apos;t load affiliate activity.</p>;

  return (
    <>
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
        <Panel title="All-time by status">
          <BucketTable rows={o.byStatus} />
        </Panel>
        <Panel title="All-time by attribution">
          <BucketTable rows={o.byAttribution} />
        </Panel>
      </div>
      <Panel title="Recent transactions">
        <TxnTable rows={o.recent} />
      </Panel>
      <Panel title="Unmatched (no user — mostly Axis, which drops sub IDs)">
        <TxnTable rows={o.unmatched} />
      </Panel>
    </>
  );
}

const AffiliateAdmin = () => {
  const [range, setRange] = useState<ReportRange>("30d");
  const report = useGetAffiliateReportQuery(range);
  const cuelinks = useGetAffiliateCuelinksQuery(range);
  const r = report.data;

  return (
    <div className="flex flex-col justify-start gap-5 p-10 max-md:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Typography variant="h4" className="text-left">
          Affiliate (Cuelinks)
        </Typography>
        <div role="group" aria-label="Date range" className="flex rounded-lg border border-white/15 p-0.5">
          {RANGES.map((o) => (
            <button
              key={o.value}
              type="button"
              aria-pressed={range === o.value}
              onClick={() => setRange(o.value)}
              className={`rounded-md px-3 py-1 text-sm cursor-pointer ${
                range === o.value ? "bg-white/15 text-white" : "text-white/60 hover:text-white"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {report.isError && <p className="text-white/60">Couldn&apos;t load the report.</p>}
      {report.isFetching && !r && <p className="text-white/60">Loading report…</p>}

      {r && (
        <>
          <KpiRow t={r.totals} />
          <Section title="Trend" hint="Clicks by click date, conversions by transaction date (IST).">
            <Trend data={r.byDay} />
          </Section>
          <FunnelTable title="By surface" hint="Which part of the product the click came from." keyLabel="Surface" rows={r.bySurface} csvName={`by-surface-${range}`} />
          <FunnelTable title="By card" hint="Card applications: clicks → leads → confirmed." keyLabel="Card" rows={r.byCard} csvName={`by-card-${range}`} />
          <FunnelTable title="By merchant" hint="Portals, voucher partners and deals." keyLabel="Merchant" rows={r.byMerchant} csvName={`by-merchant-${range}`} />
          <StepTable rows={r.byStep} />
          <UnearnedTable rows={r.unearned} />
          <AccessTable rows={r.accessNeeded} />
        </>
      )}

      <CuelinksPanel data={cuelinks.data} loading={cuelinks.isFetching && !cuelinks.data} />
      <HealthSection />
      <Activity />
    </div>
  );
};

export default AffiliateAdmin;
