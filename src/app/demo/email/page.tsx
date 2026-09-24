"use client";

import type React from "react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ISSUER_FILTERS } from "@/lib/unipile/issuers";
import {
  attachmentDownloadUrl,
  connectAccount,
  detectCards,
  fetchStatus,
  fetchEmailDetail,
  fetchMessages,
  probeAttachment,
  type EmailDetail,
  type ConnectionStatus,
  type AttachmentProbe,
  type DetectionResult,
  type MessagesResult,
} from "@/lib/unipile/demoClient";
import DetectedCards from "./DetectedCards";

const VERDICT_STYLES: Record<AttachmentProbe["verdict"], string> = {
  open: "bg-green-500/15 text-green-400 border border-green-500/30",
  "password-protected": "bg-amber-500/15 text-amber-300 border border-amber-500/30",
  "not-a-pdf": "bg-white/10 text-white/70 border border-white/20",
};

function formatBytes(n: number | null) {
  if (n === null) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 text-xs">
      <span className="w-28 shrink-0 text-white/40">{label}</span>
      <span className="min-w-0 break-words text-white/80">{value || "—"}</span>
    </div>
  );
}

function fmtAttendees(
  list: Array<{ display_name?: string; identifier?: string }>,
) {
  if (!list.length) return "—";
  return list
    .map((a) => (a.display_name ? `${a.display_name} <${a.identifier}>` : a.identifier))
    .join(", ");
}

function DetailPanel({
  detail,
  loading,
}: {
  detail: EmailDetail | undefined;
  loading: boolean;
}) {
  if (loading || !detail) {
    return (
      <div className="mt-2 rounded-lg border border-white/10 bg-white/[0.02] p-3 text-xs text-white/50">
        {loading ? "Loading full email…" : "No detail loaded."}
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-4 rounded-lg border border-white/10 bg-white/[0.02] p-4">
      <div className="space-y-1">
        <Field label="Subject" value={detail.subject} />
        <Field label="From" value={fmtAttendees(detail.from ? [detail.from] : [])} />
        <Field label="To" value={fmtAttendees(detail.to)} />
        {detail.cc.length > 0 && <Field label="Cc" value={fmtAttendees(detail.cc)} />}
        <Field
          label="Date"
          value={detail.date ? new Date(detail.date).toLocaleString() : "—"}
        />
        <Field label="Read" value={detail.readDate ? new Date(detail.readDate).toLocaleString() : "unread"} />
        <Field label="Folder / role" value={detail.role} />
        <Field label="Origin" value={detail.origin} />
        <Field label="Thread id" value={detail.threadId} />
        <Field label="Message-ID" value={detail.messageId} />
        <Field label="Provider id" value={detail.providerId} />
        <Field label="Unipile id" value={detail.id} />
      </div>

      {detail.attachments.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-semibold text-white/60">
            Attachments ({detail.attachments.length})
          </div>
          {detail.attachments.map((a) => (
            <Field
              key={a.id}
              label={a.filename}
              value={`${formatBytes(a.size)} · ${a.mime ?? "unknown"}`}
            />
          ))}
        </div>
      )}

      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs font-semibold text-white/60">
          <span>Body (text)</span>
          <span className="font-normal text-white/40">
            html {detail.bodyHtmlLength.toLocaleString()} chars
          </span>
        </div>
        <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded bg-black/40 p-3 text-xs leading-relaxed text-white/80">
          {detail.bodyPlain || "(empty body)"}
        </pre>
      </div>
    </div>
  );
}

export default function EmailDemoPage() {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [issuer, setIssuer] = useState("");
  const [afterDays, setAfterDays] = useState("180");
  const [data, setData] = useState<MessagesResult | null>(null);
  const [probes, setProbes] = useState<Record<string, AttachmentProbe>>({});
  const [details, setDetails] = useState<Record<string, EmailDetail>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [detection, setDetection] = useState<DetectionResult | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refreshStatus() {
    try {
      setStatus(await fetchStatus());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status check failed");
    } finally {
      setStatusLoading(false);
    }
  }

  useEffect(() => {
    void refreshStatus();
    // Re-check when the tab regains focus — the connect flow finishes in a
    // separate tab, so this is how the page learns the binding landed.
    const onFocus = () => void refreshStatus();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  async function onConnect() {
    setError(null);
    try {
      const { url } = await connectAccount();
      window.open(url, "_blank", "noopener");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connect failed");
    }
  }

  async function onFetch() {
    setLoading(true);
    setError(null);
    setProbes({});
    try {
      setData(
        await fetchMessages({
          issuer: issuer || undefined,
          afterDays: Number(afterDays),
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fetch failed");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  async function onFindCards() {
    setDetecting(true);
    setError(null);
    try {
      setDetection(await detectCards());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Detection failed");
      setDetection(null);
    } finally {
      setDetecting(false);
    }
  }

  async function onProbe(
    uiKey: string,
    providerId: string | null,
    attachmentId: string,
    accountId: string,
  ) {
    if (!providerId) {
      setError("Message is missing a provider id; cannot fetch attachment.");
      return;
    }
    try {
      const probe = await probeAttachment({
        emailId: providerId,
        attachmentId,
        accountId,
      });
      setProbes((p) => ({ ...p, [uiKey]: probe }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Probe failed");
    }
  }

  async function onToggleDetail(
    id: string,
    providerId: string | null,
    accountId: string,
  ) {
    if (expanded === id) {
      setExpanded(null);
      return;
    }
    setExpanded(id);
    if (details[id] || !providerId) return;
    setDetailLoading(id);
    setError(null);
    try {
      const detail = await fetchEmailDetail(providerId, accountId);
      setDetails((d) => ({ ...d, [id]: detail }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load email");
    } finally {
      setDetailLoading(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 text-white">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Email ingestion spike</h1>
        <p className="text-sm text-white/60">
          Unipile → issuer mail → statement PDF. Nothing is stored; attachments
          are fetched, inspected in memory, and discarded.
        </p>
      </header>

      {statusLoading ? (
        <section className="rounded-xl border border-white/15 p-5 text-sm text-white/50">
          Checking connection…
        </section>
      ) : !status?.connected ? (
        <section className="space-y-3 rounded-xl border border-white/15 p-6 text-center">
          <p className="text-sm text-white/70">
            No mailbox connected to your account yet. Connect the Gmail where
            your card statements arrive — it doesn&rsquo;t have to be the address
            you signed in with.
          </p>
          <Button onClick={onConnect}>Connect Gmail</Button>
          <p className="text-xs text-white/40">
            Finish the flow in the new tab, then return here — this page picks up
            the connection automatically.
          </p>
        </section>
      ) : (
        <section className="space-y-4 rounded-xl border border-white/15 p-5">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full bg-green-500/15 px-2.5 py-1 text-xs text-green-400">
              ● Connected
            </span>
            <span className="text-white/80">
              {status.accounts.length === 1
                ? (status.accounts[0]?.emailAddress ?? "your mailbox")
                : `${status.accounts.length} mailboxes: ${status.accounts
                    .map((a) => a.emailAddress ?? a.accountId)
                    .join(", ")}`}
            </span>
            <button
              onClick={onConnect}
              className="text-xs text-white/40 underline hover:text-white/70"
            >
              connect another
            </button>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label className="text-white font-semibold">Issuer</Label>
              <Select value={issuer || "all"} onValueChange={(v) => setIssuer(v === "all" ? "" : v)}>
                <SelectTrigger className="w-48 h-10 text-white">
                  <SelectValue placeholder="All issuers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All issuers</SelectItem>
                  {ISSUER_FILTERS.map((i) => (
                    <SelectItem key={i.slug} value={i.slug}>
                      {i.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-white font-semibold">Lookback</Label>
              <Select value={afterDays} onValueChange={setAfterDays}>
                <SelectTrigger className="w-36 h-10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="180">6 months</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={onFetch} disabled={loading}>
              {loading ? "Fetching…" : "Fetch issuer mail"}
            </Button>
          </div>

          <div className="space-y-2 border-t border-white/10 pt-4">
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={onFindCards} disabled={detecting}>
                {detecting ? "Reading your mail…" : "Find my cards"}
              </Button>
              <p className="text-xs text-white/45">
                Groups issuer mail by (issuer, last 4), resolves the product name
                to a catalog card, and checks whether it is still live.
              </p>
            </div>
          </div>
        </section>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {detection && <DetectedCards data={detection} />}

      {data && (
        <section className="space-y-3">
          <div className="flex flex-wrap gap-4 text-sm text-white/60">
            <span>
              <strong className="text-white">{data.total}</strong> messages
            </span>
            <span>
              <strong className="text-white">{data.withAttachments}</strong>{" "}
              with attachments
            </span>
            <span>{data.source === "synced-now" ? "synced from Unipile" : "from cache"}</span>
            {data.syncFailed.length > 0 && (
              <span className="text-amber-400">
                failed: {data.syncFailed.join(", ")}
              </span>
            )}
          </div>

          {data.messages.length === 0 && (
            <p className="rounded-xl border border-white/15 p-4 text-sm text-white/60">
              No issuer mail matched. Either the lookback is too short, or the
              sender domain is missing from the issuer list.
            </p>
          )}

          <ul className="divide-y divide-white/10 rounded-xl border border-white/15">
            {data.messages.map((m) => (
              <li key={m.id} className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{m.subject}</p>
                    <p className="truncate text-xs text-white/60">
                      {m.fromName} · {m.fromEmail}
                      {m.date ? ` · ${new Date(m.date).toLocaleDateString()}` : ""}
                    </p>
                    {data.accounts.length > 1 && m.accountEmail && (
                      <p className="truncate text-xs text-white/35">
                        inbox: {m.accountEmail}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {m.issuer && (
                      <span className="rounded bg-white/10 px-2 py-0.5 text-xs text-white/80">
                        {m.issuer}
                      </span>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs text-white hover:bg-white/10"
                      onClick={() => onToggleDetail(m.id, m.providerId, m.accountId)}
                    >
                      {expanded === m.id ? "Hide" : "Details"}
                    </Button>
                  </div>
                </div>

                {m.attachments.length > 0 && (
                  <ul className="space-y-1 pl-3">
                    {m.attachments.map((a) => {
                      const key = `${m.id}:${a.id}`;
                      const probe = probes[key];
                      return (
                        <li
                          key={a.id}
                          className="flex flex-wrap items-center gap-2 text-xs"
                        >
                          <span className="font-mono">{a.filename}</span>
                          <span className="text-white/50">
                            {formatBytes(a.size)}
                          </span>

                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs text-white hover:bg-white/10"
                            onClick={() => onProbe(key, m.providerId, a.id, m.accountId)}
                          >
                            Probe
                          </Button>

                          {probe && (
                            <>
                              <span
                                className={`rounded px-2 py-0.5 ${VERDICT_STYLES[probe.verdict]}`}
                              >
                                {probe.verdict}
                              </span>
                              <span className="text-white/50">
                                {formatBytes(probe.bytes)}
                                {probe.version ? ` · PDF ${probe.version}` : ""}
                                {probe.revision ? ` · R${probe.revision}` : ""}
                              </span>
                              <a
                                className="underline"
                                href={attachmentDownloadUrl({
                                  emailId: m.providerId ?? "",
                                  attachmentId: a.id,
                                  accountId: m.accountId,
                                })}
                                target="_blank"
                                rel="noreferrer"
                              >
                                open
                              </a>
                            </>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}

                {expanded === m.id && (
                  <DetailPanel
                    detail={details[m.id]}
                    loading={detailLoading === m.id}
                  />
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
