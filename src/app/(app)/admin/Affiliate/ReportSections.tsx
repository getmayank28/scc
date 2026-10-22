"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import dayjs from "dayjs";
import { Download } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type {
  AccessNeededRow,
  CuelinksReport,
  DayPoint,
  FunnelRow,
  UnearnedRow,
} from "@/types/affiliateReport";

/**
 * Building blocks for the admin Affiliate report. Values and labels use text
 * colours; only chart marks carry the brand orange.
 */

export const inr = (n: number | null | undefined) =>
  n == null ? "—" : `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const pct = (n: number | null) => (n == null ? "—" : `${n}%`);
const int = (n: number) => n.toLocaleString("en-IN");

// ---- CSV ---------------------------------------------------------------------

type Col<T> = { label: string; value: (row: T) => string | number | null };

function downloadCsv<T>(name: string, cols: Col<T>[], rows: T[]) {
  const esc = (v: string | number | null) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [cols.map((c) => esc(c.label)).join(","), ...rows.map((r) => cols.map((c) => esc(c.value(r))).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ---- layout --------------------------------------------------------------------

export function Section({
  title,
  hint,
  action,
  children,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-medium text-white">{title}</h3>
          {hint && <p className="mt-0.5 text-xs text-white/55">{hint}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function CsvButton<T>({ name, cols, rows }: { name: string; cols: Col<T>[]; rows: T[] }) {
  if (!rows.length) return null;
  return (
    <button
      type="button"
      onClick={() => downloadCsv(name, cols, rows)}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/15 px-2.5 py-1 text-xs text-white/80 hover:border-white/40 cursor-pointer"
    >
      <Download className="size-3.5" /> CSV
    </button>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl bg-white/[0.03] p-4 text-sm text-white/55">{children}</p>;
}

// ---- KPI row -----------------------------------------------------------------

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex min-w-[150px] flex-1 flex-col gap-1 rounded-xl bg-white/[0.04] p-4">
      <p className="text-xs text-white/60">{label}</p>
      <p className="text-2xl font-semibold text-white">{value}</p>
      {sub && <p className="text-xs text-white/50">{sub}</p>}
    </div>
  );
}

export function KpiRow({ t }: { t: FunnelRow }) {
  const earnPct = t.clicks ? Math.round((t.earningClicks / t.clicks) * 100) : null;
  return (
    <div className="flex flex-wrap gap-3">
      <Tile label="Outbound clicks" value={int(t.clicks)} sub={earnPct == null ? undefined : `${earnPct}% through an earning link`} />
      <Tile label="Conversions" value={int(t.conversions)} sub={`${t.confirmed} confirmed · ${t.pending} pending · ${t.rejected} rejected`} />
      <Tile label="Confirmed commission" value={inr(t.commissionConfirmed)} sub={`${inr(t.commissionPending)} pending`} />
      <Tile label="Conversion rate" value={pct(t.cr)} sub="conversions ÷ clicks" />
      <Tile label="Earnings per click" value={inr(t.epc)} sub="confirmed commission ÷ clicks" />
    </div>
  );
}

// ---- trend (small multiples: one series each, so no dual axis) ---------------

const barConfig = (label: string): ChartConfig => ({ value: { label, color: "var(--primary-orange)" } });

function DailyColumns({ data, field, label }: { data: DayPoint[]; field: "clicks" | "conversions"; label: string }) {
  const rows = data.map((d) => ({ day: dayjs(d.date).format("D MMM"), value: d[field] }));
  const allZero = rows.every((r) => r.value === 0);
  return (
    <div className="flex min-w-[280px] flex-1 flex-col gap-2">
      <p className="text-sm text-white/80">{label} per day</p>
      <div className="relative">
        <ChartContainer config={barConfig(label)} className="aspect-auto h-[200px] w-full">
          <BarChart data={rows} margin={{ top: 8, right: 4, bottom: 0, left: -16 }}>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey="day" tickLine={false} axisLine={false} minTickGap={24} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
            <ChartTooltip cursor={{ fill: "rgba(255,255,255,0.05)" }} content={<ChartTooltipContent />} />
            <Bar dataKey="value" name={label} fill="var(--color-value)" radius={[4, 4, 0, 0]} maxBarSize={24} />
          </BarChart>
        </ChartContainer>
        {allZero && (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-white/45">
            No {label.toLowerCase()} in this range
          </p>
        )}
      </div>
    </div>
  );
}

export function Trend({ data }: { data: DayPoint[] }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-6">
        <DailyColumns data={data} field="clicks" label="Clicks" />
        <DailyColumns data={data} field="conversions" label="Conversions" />
      </div>
      <details className="text-xs text-white/70">
        <summary className="cursor-pointer text-white/55">Daily numbers as a table</summary>
        <table className="mt-2 w-full max-w-md">
          <thead>
            <tr className="text-left text-white/50">
              <th className="py-1 font-medium">Day</th>
              <th className="py-1 text-right font-medium">Clicks</th>
              <th className="py-1 text-right font-medium">Conversions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.date} className="border-t border-white/5">
                <td className="py-1">{dayjs(d.date).format("D MMM YYYY")}</td>
                <td className="py-1 text-right">{d.clicks}</td>
                <td className="py-1 text-right">{d.conversions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

// ---- funnel tables -------------------------------------------------------------

const funnelCols = (keyLabel: string): Col<FunnelRow>[] => [
  { label: keyLabel, value: (r) => r.label },
  { label: "Clicks", value: (r) => r.clicks },
  { label: "Earning clicks", value: (r) => r.earningClicks },
  { label: "Conversions", value: (r) => r.conversions },
  { label: "Confirmed", value: (r) => r.confirmed },
  { label: "Pending", value: (r) => r.pending },
  { label: "Rejected", value: (r) => r.rejected },
  { label: "Commission confirmed (₹)", value: (r) => r.commissionConfirmed },
  { label: "Commission pending (₹)", value: (r) => r.commissionPending },
  { label: "Conversion rate (%)", value: (r) => r.cr },
  { label: "EPC (₹)", value: (r) => r.epc },
];

export function FunnelTable({
  title,
  hint,
  keyLabel,
  rows,
  csvName,
}: {
  title: string;
  hint?: string;
  keyLabel: string;
  rows: FunnelRow[];
  csvName: string;
}) {
  const cols = funnelCols(keyLabel);
  return (
    <Section title={title} hint={hint} action={<CsvButton name={csvName} cols={cols} rows={rows} />}>
      {rows.length === 0 ? (
        <Empty>No clicks or conversions in this range.</Empty>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-white/50">
                <th className="py-1.5 pr-4 font-medium">{keyLabel}</th>
                <th className="py-1.5 pr-4 text-right font-medium">Clicks</th>
                <th className="py-1.5 pr-4 text-right font-medium">Earning</th>
                <th className="py-1.5 pr-4 text-right font-medium">Conv.</th>
                <th className="py-1.5 pr-4 text-right font-medium">Confirmed</th>
                <th className="py-1.5 pr-4 text-right font-medium">Commission</th>
                <th className="py-1.5 pr-4 text-right font-medium">Pending ₹</th>
                <th className="py-1.5 pr-4 text-right font-medium">CR</th>
                <th className="py-1.5 text-right font-medium">EPC</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className="border-t border-white/5 text-white/85">
                  <td className="py-1.5 pr-4">{r.label}</td>
                  <td className="py-1.5 pr-4 text-right tabular-nums">{int(r.clicks)}</td>
                  <td className="py-1.5 pr-4 text-right tabular-nums">{int(r.earningClicks)}</td>
                  <td className="py-1.5 pr-4 text-right tabular-nums">{int(r.conversions)}</td>
                  <td className="py-1.5 pr-4 text-right tabular-nums">{int(r.confirmed)}</td>
                  <td className="py-1.5 pr-4 text-right tabular-nums">{inr(r.commissionConfirmed)}</td>
                  <td className="py-1.5 pr-4 text-right tabular-nums text-white/60">{inr(r.commissionPending)}</td>
                  <td className="py-1.5 pr-4 text-right tabular-nums">{pct(r.cr)}</td>
                  <td className="py-1.5 text-right tabular-nums">{inr(r.epc)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}

const STEP_LABELS: Record<string, string> = {
  cuelinks: "Cuelinks (converted)",
  cuelinks_static: "Cuelinks (pre-made link)",
  gromo: "GroMo",
  partner: "Other affiliate network",
  direct: "Plain URL — not earning",
  bank_site: "Bank website",
  internal: "Back into the app — nothing on file",
};

export function StepTable({ rows }: { rows: { step: string; clicks: number }[] }) {
  const total = rows.reduce((n, r) => n + r.clicks, 0);
  return (
    <Section title="Clicks by outcome" hint="Where each outbound click actually went.">
      {rows.length === 0 ? (
        <Empty>No clicks in this range.</Empty>
      ) : (
        <table className="w-full max-w-lg text-sm">
          <tbody>
            {rows.map((r) => (
              <tr key={r.step} className="border-t border-white/5 text-white/85">
                <td className="py-1.5 pr-4">{STEP_LABELS[r.step] ?? r.step}</td>
                <td className="py-1.5 pr-4 text-right tabular-nums">{int(r.clicks)}</td>
                <td className="py-1.5 text-right tabular-nums text-white/55">
                  {Math.round((r.clicks / total) * 100)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Section>
  );
}

// ---- leakage -------------------------------------------------------------------

const REASON: Record<UnearnedRow["reason"], string> = {
  needs_access: "Campaign needs an access request",
  not_linked: "Open campaign, but we link somewhere it doesn't cover — point the card/portal at the campaign's landing page",
  no_campaign: "No Cuelinks campaign for this site",
  no_destination: "Nothing on file — add a link",
};

export function UnearnedTable({ rows }: { rows: UnearnedRow[] }) {
  const cols: Col<UnearnedRow>[] = [
    { label: "Type", value: (r) => r.type },
    { label: "Name", value: (r) => r.label },
    { label: "Clicks", value: (r) => r.clicks },
    { label: "Went to", value: (r) => r.destinationHost },
    { label: "Why it didn't earn", value: (r) => REASON[r.reason] },
    { label: "Campaign", value: (r) => (r.campaign ? `${r.campaign.name} (${r.campaign.id}, ${r.campaign.status})` : null) },
  ];
  return (
    <Section
      title="Clicks that didn't earn"
      hint="Ranked by clicks lost. Fix the top rows first."
      action={<CsvButton name="unearned-clicks" cols={cols} rows={rows} />}
    >
      {rows.length === 0 ? (
        <Empty>Every click in this range went out through an earning link.</Empty>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-white/50">
                <th className="py-1.5 pr-4 font-medium">Name</th>
                <th className="py-1.5 pr-4 font-medium">Type</th>
                <th className="py-1.5 pr-4 text-right font-medium">Clicks</th>
                <th className="py-1.5 pr-4 font-medium">Went to</th>
                <th className="py-1.5 font-medium">Why / what to do</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={`${r.type}:${r.key}`} className="border-t border-white/5 align-top text-white/85">
                  <td className="py-1.5 pr-4">{r.label}</td>
                  <td className="py-1.5 pr-4 text-white/60">{r.type}</td>
                  <td className="py-1.5 pr-4 text-right tabular-nums">{int(r.clicks)}</td>
                  <td className="py-1.5 pr-4 text-white/60">{r.destinationHost ?? "—"}</td>
                  <td className="py-1.5">
                    {REASON[r.reason]}
                    {r.campaign && (
                      <span className="block text-xs text-white/50">
                        {r.campaign.name} · #{r.campaign.id} · {r.campaign.status}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}

export function AccessTable({ rows }: { rows: AccessNeededRow[] }) {
  const cols: Col<AccessNeededRow>[] = [
    { label: "Campaign", value: (r) => r.campaignName },
    { label: "Campaign ID", value: (r) => r.campaignId },
    { label: "Status", value: (r) => r.status },
    { label: "Payout", value: (r) => `${r.payout} ${r.payoutType}` },
    { label: "Clicks lost in range", value: (r) => r.lostClicks },
    { label: "Used by", value: (r) => r.usedBy.join("; ") },
  ];
  return (
    <Section
      title="Campaigns that need access"
      hint="Apply for these in the Cuelinks dashboard (Campaigns → search the ID → Apply). Pending means we've already applied."
      action={<CsvButton name="campaigns-needing-access" cols={cols} rows={rows} />}
    >
      {rows.length === 0 ? (
        <Empty>No campaigns waiting on access.</Empty>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-white/50">
                <th className="py-1.5 pr-4 font-medium">Campaign</th>
                <th className="py-1.5 pr-4 font-medium">Status</th>
                <th className="py-1.5 pr-4 font-medium">Payout</th>
                <th className="py-1.5 pr-4 text-right font-medium">Clicks lost</th>
                <th className="py-1.5 font-medium">Used by</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.campaignId} className="border-t border-white/5 align-top text-white/85">
                  <td className="py-1.5 pr-4">
                    {r.campaignName}
                    <span className="block text-xs text-white/50">#{r.campaignId}</span>
                  </td>
                  <td className="py-1.5 pr-4">{r.status === "pending" ? "Applied — pending" : "Not applied"}</td>
                  <td className="py-1.5 pr-4 text-white/70">{r.payout} {r.payoutType}</td>
                  <td className="py-1.5 pr-4 text-right tabular-nums">{int(r.lostClicks)}</td>
                  <td className="py-1.5 text-white/70">{r.usedBy.join(", ") || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}

// ---- Cuelinks' numbers ---------------------------------------------------------

export function CuelinksPanel({ data, loading }: { data?: CuelinksReport; loading: boolean }) {
  if (loading) return <Section title="Cuelinks reports"><Empty>Loading Cuelinks reports…</Empty></Section>;
  if (!data) return <Section title="Cuelinks reports"><Empty>Couldn&apos;t load Cuelinks reports.</Empty></Section>;
  const r = data.reconciliation;
  const statusLabel: Record<string, string> = {
    available: "Open campaign exists",
    available_on_approval: "Campaign needs access",
    not_available: "No campaign",
  };

  return (
    <Section title="Cuelinks reports" hint="Cuelinks' own numbers for the same range, cached for an hour.">
      {data.errors.length > 0 && (
        <p className="rounded-lg bg-destructive/15 px-3 py-2 text-xs text-white">
          Couldn&apos;t load: {data.errors.join(", ")}. Other sections are current.
        </p>
      )}

      {r && (
        <div className={`rounded-xl p-4 text-sm ${r.mismatch ? "bg-destructive/15" : "bg-white/[0.04]"}`}>
          <p className="font-medium text-white">
            {r.mismatch ? "⚠ Our numbers and Cuelinks' disagree" : "✓ Our numbers match Cuelinks"}
          </p>
          <p className="mt-1 text-white/70">
            Conversions — ours {r.ours.transactions}, Cuelinks {r.cuelinks.transactions} · Commission — ours{" "}
            {inr(r.ours.commission)}, Cuelinks {inr(r.cuelinks.commission)}
          </p>
          {r.mismatch && (
            <p className="mt-1 text-xs text-white/60">
              Usually a missed webhook or a failed nightly sync. Check Health below, or run scripts/cuelinks-sync.ts.
            </p>
          )}
        </div>
      )}

      {data.performance && (
        <div className="flex flex-wrap gap-3">
          <Tile label="Cuelinks clicks" value={int(data.performance.totals.clicks)} />
          <Tile label="Cuelinks conversions" value={int(data.performance.totals.transactions)} />
          <Tile label="Cuelinks commission" value={inr(data.performance.totals.commission)} />
          <Tile label="Cuelinks EPC" value={inr(data.performance.totals.epc)} />
        </div>
      )}

      <div className="grid grid-cols-2 max-xl:grid-cols-1 gap-4">
        <div>
          <p className="mb-1 text-sm text-white/80">Monthly earnings by status</p>
          {!data.earnings?.length ? (
            <Empty>No earnings yet.</Empty>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-white/50">
                  <th className="py-1 font-medium">Month</th>
                  <th className="py-1 text-right font-medium">Pending</th>
                  <th className="py-1 text-right font-medium">Validated</th>
                  <th className="py-1 text-right font-medium">Payable</th>
                  <th className="py-1 text-right font-medium">Claimed</th>
                  <th className="py-1 text-right font-medium">Rejected</th>
                </tr>
              </thead>
              <tbody>
                {data.earnings.map((e) => (
                  <tr key={e.month} className="border-t border-white/5 text-white/85">
                    <td className="py-1">{dayjs(`${e.month}-01`).format("MMM YYYY")}</td>
                    <td className="py-1 text-right tabular-nums">{inr(e.pending)}</td>
                    <td className="py-1 text-right tabular-nums">{inr(e.validated)}</td>
                    <td className="py-1 text-right tabular-nums">{inr(e.payable)}</td>
                    <td className="py-1 text-right tabular-nums">{inr(e.claimed)}</td>
                    <td className="py-1 text-right tabular-nums">{inr(e.rejected)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div>
          <p className="mb-1 text-sm text-white/80">Sites we sent unmonetized clicks to</p>
          {!data.unmonetized?.length ? (
            <Empty>None in this range.</Empty>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {data.unmonetized.map((u) => (
                  <tr key={u.domain} className="border-t border-white/5 text-white/85">
                    <td className="py-1 pr-4">{u.domain}</td>
                    <td className="py-1 pr-4 text-right tabular-nums">{int(u.clicks)}</td>
                    <td className="py-1 text-white/60">{statusLabel[u.status] ?? u.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div>
        <p className="mb-1 text-sm text-white/80">By campaign and channel</p>
        {!data.campaigns?.length ? (
          <Empty>No campaign activity in this range.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-white/50">
                  <th className="py-1 pr-4 font-medium">Campaign</th>
                  <th className="py-1 pr-4 font-medium">Channel</th>
                  <th className="py-1 pr-4 text-right font-medium">Clicks</th>
                  <th className="py-1 pr-4 text-right font-medium">Conv.</th>
                  <th className="py-1 pr-4 text-right font-medium">Commission</th>
                  <th className="py-1 text-right font-medium">EPC</th>
                </tr>
              </thead>
              <tbody>
                {data.campaigns.map((c, i) => (
                  <tr key={`${c.campaignName}-${c.channelName}-${i}`} className="border-t border-white/5 text-white/85">
                    <td className="py-1 pr-4">{c.campaignName}</td>
                    <td className="py-1 pr-4 text-white/60">{c.channelName}</td>
                    <td className="py-1 pr-4 text-right tabular-nums">{int(c.clicks)}</td>
                    <td className="py-1 pr-4 text-right tabular-nums">{int(c.transactions)}</td>
                    <td className="py-1 pr-4 text-right tabular-nums">{inr(c.commission)}</td>
                    <td className="py-1 text-right tabular-nums">{inr(c.epc)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Section>
  );
}
