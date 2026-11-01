"use client";

import { Fragment, useState } from "react";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { AlertTriangle, Loader2 } from "lucide-react";
import {
  useGetCampaignReportQuery,
  useIssueCampaignVoucherMutation,
  useLazyGetCampaignClaimsByPhoneQuery,
} from "@/store/admin";
import type {
  AdminClaimRow,
  CampaignRange,
  ReviewTxnRow,
} from "@/types/rewards";
import { CsvButton, Empty, Section, inr, type Col } from "../Affiliate/ReportSections";
import { cn } from "@/lib/utils/index";

/**
 * Festive campaign admin: health, money, funnel, the voucher queue (issue
 * form, 48h clock), the needs-review lists, and a per-phone claim timeline.
 * Page views and sign-ins are in Amplitude; this shows what the DB knows.
 */

const RANGES: CampaignRange[] = ["7d", "30d", "90d", "all"];

const FLAG_LABELS: Record<string, string> = {
  inferred_match: "User guessed (no sub ID)",
  holds_bank_card: "Already holds a card from this bank",
  clawback: "Rejected after voucher issued — write-off",
};

const when = (d: string | null) => (d ? dayjs(d).format("D MMM, HH:mm") : "—");

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return <th className={cn("py-1.5 pr-4 font-medium", right && "text-right")}>{children}</th>;
}
function Td({ children, right, className }: { children: React.ReactNode; right?: boolean; className?: string }) {
  return <td className={cn("py-1.5 pr-4 align-top", right && "text-right tabular-nums", className)}>{children}</td>;
}

function Tile({ label, value, sub, warn }: { label: string; value: string; sub?: string; warn?: boolean }) {
  return (
    <div className={cn("flex min-w-[150px] flex-1 flex-col gap-1 rounded-xl p-4", warn ? "bg-red-500/10" : "bg-white/[0.04]")}>
      <p className="text-xs text-white/60">{label}</p>
      <p className={cn("text-xl font-semibold", warn ? "text-red-300" : "text-white")}>{value}</p>
      {sub && <p className="text-xs text-white/50">{sub}</p>}
    </div>
  );
}

function Flags({ flags }: { flags: string[] }) {
  if (!flags.length) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {flags.map((f) => (
        <span key={f} className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
          {FLAG_LABELS[f] ?? f}
        </span>
      ))}
    </div>
  );
}

function Clock({ hours }: { hours: number | null }) {
  if (hours == null) return <>—</>;
  const tone = hours < 0 ? "text-red-400" : hours < 12 ? "text-amber-300" : "text-secondary-success";
  return <span className={cn("font-semibold", tone)}>{hours < 0 ? `${-hours}h overdue` : `${hours}h left`}</span>;
}

function IssueForm({ claim, onDone }: { claim: AdminClaimRow; onDone: () => void }) {
  const [issue, { isLoading }] = useIssueCampaignVoucherMutation();
  const [brand, setBrand] = useState("");
  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");
  const [expiry, setExpiry] = useState("");
  const input = "h-9 rounded-md border border-white/10 bg-black/30 px-2 text-sm text-white placeholder:text-white/30";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await issue({ id: claim.id, brand, code, pin: pin || undefined, expiry: expiry || undefined }).unwrap();
      toast.success(`Issued ${inr(claim.amount)} to ${claim.phone ?? "user"}`);
      onDone();
    } catch (err) {
      toast.error((err as { data?: { message?: string } })?.data?.message ?? "Couldn't issue the voucher");
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-2 rounded-lg bg-white/[0.04] p-3">
      <label className="flex flex-col gap-1 text-[11px] text-white/55">
        Brand
        <input className={input} value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Amazon Pay" required />
      </label>
      <label className="flex flex-col gap-1 text-[11px] text-white/55">
        Code
        <input className={cn(input, "font-mono")} value={code} onChange={(e) => setCode(e.target.value)} required />
      </label>
      <label className="flex flex-col gap-1 text-[11px] text-white/55">
        PIN (optional)
        <input className={cn(input, "w-28 font-mono")} value={pin} onChange={(e) => setPin(e.target.value)} />
      </label>
      <label className="flex flex-col gap-1 text-[11px] text-white/55">
        Expiry (optional)
        <input type="date" className={input} value={expiry} onChange={(e) => setExpiry(e.target.value)} />
      </label>
      <p className="text-xs text-white/55">Amount: {inr(claim.amount)}</p>
      <button
        type="submit"
        disabled={isLoading}
        className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-md bg-primary-orange px-4 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isLoading && <Loader2 className="size-4 animate-spin" />}
        Issue voucher
      </button>
    </form>
  );
}

const queueCols: Col<AdminClaimRow>[] = [
  { label: "Phone", value: (r) => r.phone },
  { label: "Name", value: (r) => r.name },
  { label: "Card", value: (r) => r.cardName },
  { label: "Amount", value: (r) => r.amount },
  { label: "Approved", value: (r) => r.approvedAt },
  { label: "Hours left", value: (r) => r.hoursLeft },
  { label: "Flags", value: (r) => r.flags.join(" ") },
  { label: "Cuelinks id", value: (r) => r.cuelinksId },
];

function QueueTable({ rows }: { rows: AdminClaimRow[] }) {
  const [open, setOpen] = useState<string | null>(null);
  if (!rows.length) return <Empty>No approved claims waiting for a voucher.</Empty>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-white/50">
            <Th>User</Th>
            <Th>Card</Th>
            <Th right>Amount</Th>
            <Th>Approved</Th>
            <Th>48h clock</Th>
            <Th>{""}</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <Fragment key={r.id}>
              <tr className="border-t border-white/5 text-white/85">
                <Td>
                  {r.phone ?? "—"}
                  <div className="text-xs text-white/45">{r.name}</div>
                </Td>
                <Td>
                  {r.cardName}
                  <Flags flags={r.flags} />
                </Td>
                <Td right>{inr(r.amount)}</Td>
                <Td>{when(r.approvedAt)}</Td>
                <Td>
                  <Clock hours={r.hoursLeft} />
                </Td>
                <Td>
                  <button
                    type="button"
                    onClick={() => setOpen(open === r.id ? null : r.id)}
                    className="text-xs font-semibold text-primary-orange hover:underline"
                  >
                    {open === r.id ? "Cancel" : "Issue"}
                  </button>
                </Td>
              </tr>
              {open === r.id && (
                <tr>
                  <td colSpan={6} className="pb-3">
                    <IssueForm claim={r} onDone={() => setOpen(null)} />
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ClaimRowsTable({ rows }: { rows: AdminClaimRow[] }) {
  if (!rows.length) return <Empty>Nothing flagged.</Empty>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-white/50">
            <Th>User</Th>
            <Th>Card</Th>
            <Th>Status</Th>
            <Th>Applied</Th>
            <Th>Flags</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-white/5 text-white/85">
              <Td>{r.phone ?? r.userId}</Td>
              <Td>{r.cardName}</Td>
              <Td>{r.status}</Td>
              <Td>{when(r.appliedAt)}</Td>
              <Td>
                <Flags flags={r.flags} />
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TxnTable({ rows, empty }: { rows: ReviewTxnRow[]; empty: string }) {
  if (!rows.length) return <Empty>{empty}</Empty>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-white/50">
            <Th>Cuelinks id</Th>
            <Th>Campaign</Th>
            <Th>Card</Th>
            <Th>Surface</Th>
            <Th>User</Th>
            <Th>Status</Th>
            <Th>Date</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.cuelinksId} className="border-t border-white/5 text-white/85">
              <Td className="tabular-nums">{t.cuelinksId}</Td>
              <Td>{t.campaignName ?? t.campaignId ?? "—"}</Td>
              <Td>{t.cardSlug ?? "—"}</Td>
              <Td>{t.surface ?? "—"}</Td>
              <Td>{t.phone ?? t.userId ?? "—"}</Td>
              <Td>{t.status}</Td>
              <Td>{t.transactionDate ? dayjs(t.transactionDate).format("D MMM YYYY") : "—"}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ClaimLookup() {
  const [phone, setPhone] = useState("");
  const [lookup, { data, isFetching, isError, error }] = useLazyGetCampaignClaimsByPhoneQuery();
  return (
    <Section title="Claim lookup" hint="Every claim for a phone number, with its full timeline.">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          lookup(phone);
        }}
        className="flex gap-2"
      >
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="10-digit phone"
          className="h-9 w-48 rounded-md border border-white/10 bg-black/30 px-2 text-sm text-white placeholder:text-white/30"
        />
        <button type="submit" className="h-9 rounded-md bg-white/10 px-4 text-sm font-semibold text-white hover:bg-white/15">
          {isFetching ? <Loader2 className="size-4 animate-spin" /> : "Search"}
        </button>
      </form>
      {isError && (
        <p className="text-sm text-red-300">
          {(error as { data?: { message?: string } })?.data?.message ?? "Lookup failed"}
        </p>
      )}
      {data && !data.length && <Empty>No claims for this number.</Empty>}
      {data?.map((c) => (
        <div key={c.id} className="rounded-xl bg-white/[0.03] p-4">
          <p className="text-sm font-medium text-white">
            {c.cardName} · {inr(c.amount)} · <span className="text-white/60">{c.status}</span>
          </p>
          <Flags flags={c.flags} />
          <ol className="mt-3 flex flex-col gap-1.5 border-l border-white/10 pl-4">
            {c.timeline.map((e, i) => (
              <li key={i} className="text-xs text-white/75">
                <span className="tabular-nums text-white/45">{when(e.at)}</span> — {e.label}
                {e.detail && <span className="text-white/45"> ({e.detail})</span>}
              </li>
            ))}
          </ol>
        </div>
      ))}
    </Section>
  );
}

export default function CampaignAdmin() {
  const [range, setRange] = useState<CampaignRange>("30d");
  const { data, isLoading, isError } = useGetCampaignReportQuery(range);

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex items-center gap-2">
        <h2 className="mr-auto text-lg font-semibold text-white">Festive campaign</h2>
        {RANGES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            className={cn(
              "rounded-md px-3 py-1 text-xs font-semibold",
              range === r ? "bg-primary-orange text-white" : "bg-white/5 text-white/70 hover:bg-white/10",
            )}
          >
            {r === "all" ? "All time" : r}
          </button>
        ))}
      </div>

      {isLoading && <div className="h-40 animate-pulse rounded-2xl bg-white/[0.04]" />}
      {isError && <Empty>Couldn&apos;t load the campaign report.</Empty>}

      {data && (
        <>
          {(data.health.webhookStale || !data.health.voucherKeyConfigured) && (
            <div className="flex items-start gap-2 rounded-xl bg-red-500/10 p-3 text-sm text-red-200">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <div>
                {data.health.webhookStale && (
                  <p>
                    No Cuelinks webhook in 24 hours (last: {when(data.health.lastWebhookAt)}). Approvals may be
                    arriving only through the daily sync.
                  </p>
                )}
                {!data.health.voucherKeyConfigured && <p>VOUCHER_ENC_KEY is not set — vouchers can&apos;t be issued.</p>}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Tile label="Owed (approved, not issued)" value={inr(data.money.liability)} sub={`${data.queue.length} in queue`} />
            <Tile label="Issued" value={inr(data.money.issued)} sub={`${inr(data.money.revealed)} revealed`} />
            <Tile label="Commission on these claims" value={inr(data.money.commission)} sub="Cuelinks, approved + issued" />
            <Tile label="Write-offs" value={inr(data.money.writeOffs)} sub="rejected after issuing" warn={data.money.writeOffs > 0} />
          </div>

          <Section
            title="Voucher queue"
            hint="Approved claims, oldest first. Vouchers are due within 48 hours of approval."
            action={<CsvButton name="festive-voucher-queue" cols={queueCols} rows={data.queue} />}
          >
            <QueueTable rows={data.queue} />
          </Section>

          <Section title="Funnel" hint="Apply clicks from the campaign page → claims. Views and sign-ins are in Amplitude.">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-white/50">
                    <Th>Card</Th>
                    <Th right>Apply clicks</Th>
                    <Th right>Applied</Th>
                    <Th right>Approved</Th>
                    <Th right>Issued</Th>
                    <Th right>Revealed</Th>
                    <Th right>Rejected</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.funnel.map((f) => (
                    <tr
                      key={f.key}
                      className={cn("border-t border-white/5 text-white/85", f.key === "all" && "font-semibold text-white")}
                    >
                      <Td>{f.label}</Td>
                      <Td right>{f.applyClicks}</Td>
                      <Td right>{f.applied}</Td>
                      <Td right>{f.approved}</Td>
                      <Td right>{f.issued}</Td>
                      <Td right>{f.revealed}</Td>
                      <Td right>{f.rejected}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="Needs review: flagged claims" hint="Check these before issuing.">
            <ClaimRowsTable rows={data.review.flagged} />
          </Section>
          <Section
            title="Needs review: HDFC leads without a card"
            hint="Cuelinks credits both HDFC cards to one campaign; without subid4 we can't tell which card this was."
          >
            <TxnTable rows={data.review.hdfcNoSubid} empty="None in this range." />
          </Section>
          <Section
            title="Needs review: festive cards applied from other pages"
            hint="Not from the campaign page, so no claim was created. Use this to answer support questions."
          >
            <TxnTable rows={data.review.otherSurface} empty="None in this range." />
          </Section>
          <Section title="Needs review: card leads not matched to any user">
            <TxnTable rows={data.review.unmatched} empty="None in this range." />
          </Section>

          <ClaimLookup />

          <Section title="Setup">
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded bg-white/5 px-2 py-1 text-white/70">
                Last webhook: {when(data.health.lastWebhookAt)}
              </span>
              <span className="rounded bg-white/5 px-2 py-1 text-white/70">Last sync: {when(data.health.lastSyncAt)}</span>
              {Object.entries(data.health.templatesConfigured).map(([k, ok]) => (
                <span
                  key={k}
                  className={cn("rounded px-2 py-1", ok ? "bg-secondary-success/15 text-secondary-success" : "bg-amber-500/15 text-amber-300")}
                >
                  WhatsApp {k}: {ok ? "on" : "template id not set"}
                </span>
              ))}
            </div>
          </Section>
        </>
      )}
    </div>
  );
}
