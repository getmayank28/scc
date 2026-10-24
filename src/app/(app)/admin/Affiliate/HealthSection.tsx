"use client";

import { useState } from "react";
import dayjs from "dayjs";
import { RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { useCheckAffiliateHealthMutation, useGetAffiliateHealthQuery } from "@/store/admin";
import type { HealthItem } from "@/types/affiliateReport";
import { CsvButton, Empty, ReasonCell, Section, type Col } from "./ReportSections";
import { describeReason, reasonLine } from "@/lib/affiliate/reasonText";

/**
 * Link health: every card, portal and voucher partner checked ahead of
 * clicks — does it earn, and does its page still exist — plus what changed
 * this week. Not range-bound; the daily cron keeps it current.
 */

const CHANGE_LABEL: Record<string, string> = {
  stopped_earning: "Stopped earning",
  started_earning: "Started earning",
  downgraded: "Fell to a lower route",
  upgraded: "Moved to a better route",
  broke: "Page broke",
  recovered: "Page recovered",
};

const PAGE_LABEL: Record<string, string> = {
  ok: "Page OK",
  not_found: "Not found",
  error: "Error",
  blocked: "Blocked bots (fine)",
  skipped: "Affiliate link (not fetched)",
};

const when = (d: string | null) => (d ? dayjs(d).format("D MMM, HH:mm") : "—");

function CheckNow({ item, onDone }: { item: HealthItem; onDone: () => void }) {
  const [check, { isLoading }] = useCheckAffiliateHealthMutation();
  return (
    <button
      type="button"
      disabled={isLoading}
      onClick={async () => {
        try {
          const r = await check(item.key).unwrap();
          toast.success(
            `${r.label}: ${r.affiliated ? "earns" : "doesn't earn"}${r.broken ? ", page broken" : ""}`,
          );
          onDone();
        } catch {
          toast.error("Check failed");
        }
      }}
      className="inline-flex items-center gap-1 rounded-md border border-white/15 px-2 py-0.5 text-xs text-white/80 hover:border-white/40 disabled:opacity-50 cursor-pointer"
      aria-label={`Check ${item.label} now`}
    >
      <RefreshCw className={`size-3 ${isLoading ? "animate-spin" : ""}`} />
      {isLoading ? "Checking" : "Check now"}
    </button>
  );
}

function ItemTable({
  rows,
  mode,
  onChecked,
}: {
  rows: HealthItem[];
  mode: "changes" | "problems";
  onChecked: () => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-white/50">
            <th className="py-1.5 pr-4 font-medium">Name</th>
            <th className="py-1.5 pr-4 font-medium">Type</th>
            <th className="py-1.5 pr-4 text-right font-medium">Clicks (30d)</th>
            <th className="py-1.5 pr-4 font-medium">{mode === "changes" ? "Change" : "Problem"}</th>
            <th className="py-1.5 pr-4 font-medium">Goes to</th>
            <th className="py-1.5 pr-4 font-medium">{mode === "changes" ? "When" : "Checked"}</th>
            <th className="py-1.5 font-medium" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-t border-white/5 align-top text-white/85">
              <td className="py-1.5 pr-4">{r.label}</td>
              <td className="py-1.5 pr-4 text-white/60">{r.type}</td>
              <td className="py-1.5 pr-4 text-right tabular-nums">{r.clicks30d}</td>
              <td className="py-1.5 pr-4">
                {mode === "changes" ? (
                  <>
                    {CHANGE_LABEL[r.lastChange ?? ""] ?? r.lastChange}
                    {r.campaign && (
                      <span className="block text-xs text-white/50">
                        {r.campaign.name} · #{r.campaign.id} · {r.campaign.status}
                      </span>
                    )}
                  </>
                ) : (
                  <ReasonCell text={describeReason(r.reason, r.campaign, r.destinationHost)} campaign={r.campaign} />
                )}
              </td>
              <td className="py-1.5 pr-4 text-white/60">
                {r.destinationHost ?? "—"}
                {r.pageStatus && <span className="block text-xs text-white/45">{PAGE_LABEL[r.pageStatus] ?? r.pageStatus}</span>}
              </td>
              <td className="py-1.5 pr-4 whitespace-nowrap text-white/60">
                {when(mode === "changes" ? r.lastChangeAt : r.checkedAt)}
              </td>
              <td className="py-1.5">
                <CheckNow item={r} onDone={onChecked} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function HealthSection() {
  const { data, isLoading, isError, refetch } = useGetAffiliateHealthQuery();
  const [filter, setFilter] = useState<"all" | "card" | "portal" | "voucher">("all");

  if (isLoading) return <Section title="Link health"><Empty>Loading link health…</Empty></Section>;
  if (isError || !data) return <Section title="Link health"><Empty>Couldn&apos;t load link health.</Empty></Section>;

  const problems = data.problems.filter((p) => filter === "all" || p.type === filter);
  const cols: Col<HealthItem>[] = [
    { label: "Type", value: (r) => r.type },
    { label: "Name", value: (r) => r.label },
    { label: "Clicks (30d)", value: (r) => r.clicks30d },
    { label: "Problem", value: (r) => reasonLine(describeReason(r.reason, r.campaign, r.destinationHost)) },
    { label: "Route", value: (r) => r.step },
    { label: "Goes to", value: (r) => r.destinationHost },
    { label: "Page", value: (r) => r.pageStatus },
    { label: "Campaign", value: (r) => (r.campaign ? `${r.campaign.name} (${r.campaign.id}, ${r.campaign.status})` : null) },
    { label: "Checked", value: (r) => r.checkedAt },
  ];

  return (
    <Section
      title="Link health"
      hint={
        data.allCheckedSince
          ? `Every target checked since ${when(data.allCheckedSince)}. Clicked targets are re-checked daily.`
          : "First pass in progress — the daily job checks the most-clicked targets first."
      }
    >
      <div className="flex flex-wrap gap-3">
        {data.summary.map((s) => (
          <div key={s.type} className="flex min-w-[200px] flex-1 flex-col gap-1 rounded-xl bg-white/[0.04] p-4">
            <p className="text-xs capitalize text-white/60">{s.type}s · {s.total}</p>
            <p className="text-sm text-white">
              <span className="font-semibold">{s.earning}</span> earning ·{" "}
              <span className="font-semibold">{s.notEarning}</span> not earning
            </p>
            <p className="text-xs text-white/55">
              {s.broken} broken page{s.broken === 1 ? "" : "s"}
              {s.unchecked ? ` · ${s.unchecked} not checked yet` : ""}
            </p>
          </div>
        ))}
      </div>

      <div>
        <p className="mb-1 text-sm text-white/80">Changes in the last 7 days</p>
        {data.changes.length === 0 ? (
          <Empty>No changes this week.</Empty>
        ) : (
          <ItemTable rows={data.changes} mode="changes" onChecked={refetch} />
        )}
      </div>

      <div>
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-white/80">Not earning or broken, most-clicked first</p>
          <div className="flex items-center gap-2">
            <div role="group" aria-label="Filter by type" className="flex rounded-lg border border-white/15 p-0.5">
              {(["all", "card", "portal", "voucher"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={filter === t}
                  onClick={() => setFilter(t)}
                  className={`rounded-md px-2.5 py-0.5 text-xs capitalize cursor-pointer ${
                    filter === t ? "bg-white/15 text-white" : "text-white/60 hover:text-white"
                  }`}
                >
                  {t === "all" ? "All" : `${t}s`}
                </button>
              ))}
            </div>
            <CsvButton name="link-health-problems" cols={cols} rows={problems} />
          </div>
        </div>
        {problems.length === 0 ? (
          <Empty>Nothing to fix here.</Empty>
        ) : (
          <ItemTable rows={problems} mode="problems" onChecked={refetch} />
        )}
      </div>
    </Section>
  );
}
