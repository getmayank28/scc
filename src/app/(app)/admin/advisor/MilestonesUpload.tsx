"use client";

import { useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  Loader2,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Typography from "@/components/Typography/Typography";
import { TEMPLATE_COLUMNS } from "@/lib/advisor/bulkMilestones";

interface UploadResult {
  rowsInFile: number;
  inserted: number;
  replaced: number;
  written: number;
  duplicateDropped: number;
  totalDropped: number;
  blankRowsSkipped: number;
  validationDropped: number;
  unknownSlugRows: number;
  cardsAffected: string[];
  dropReasons: { code: string; count: number }[];
  unknownSlugs: string[];
  failedRows: Record<string, string | number>[];
  failedRowsTruncated: boolean;
}

const FAILED_COLUMNS = ["row", ...TEMPLATE_COLUMNS, "code", "reason"] as const;

const REASON_LABELS: Record<string, string> = {
  blank_row: "Blank rows (no data)",
  missing_slug: "Missing slug_id",
  unknown_period:
    "Bad milestone_period (one_time / daily / quarterly / halfyearly / annually)",
  unknown_benefit_type:
    "Bad benefit_type (points / cashback / membership / voucher)",
  bad_number: "A numeric cell is not a number",
  unknown_slug: "Card slug not found in advisor cards",
  duplicate:
    "Duplicate (slug_id, milestone_type, spend_threshold_inr) — superseded by a later row",
};

const COLUMNS: { name: string; required: boolean; desc: string }[] = [
  { name: "slug_id", required: true, desc: "Card slug → cardAdvisorKey, e.g. idfc-first-mayura--idfc. Used to find the card." },
  { name: "card_name", required: false, desc: "Human-readable card name. Read for reference only — not stored on the milestone." },
  { name: "crad_id", required: false, desc: "Card id from the source sheet. Read for reference only — not stored on the milestone." },
  { name: "milestone_type", required: false, desc: "Free-text milestone label, e.g. annual_spend, joining. Part of the upsert identity (blank allowed)." },
  { name: "milestone_period", required: false, desc: "One of one_time / daily / quarterly / halfyearly / annually. Blank = none." },
  { name: "spend_threshold_inr", required: false, desc: "Spend needed to unlock this milestone (₹). Part of the upsert identity. Blank = none." },
  { name: "tier_order", required: false, desc: "Sequence within a mutual_exclusivity_group (1, 2, 3…) — which tier is 'higher'. Blank = none." },
  { name: "mutual_exclusivity_group", required: false, desc: "Tiers sharing this key are alternatives — a higher tier replaces the lower instead of stacking. Blank = none." },
  { name: "benefit_type", required: false, desc: "One of points / cashback / membership / voucher. Blank = none." },
  { name: "benefit_value_inr", required: false, desc: "Value of the benefit (₹). Blank = none." },
  { name: "is_active", required: false, desc: "true / false (also yes/no, 1/0). Defaults to true when blank." },
];

const MilestonesUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Download every dropped row (original columns + reason) as an .xlsx so it can
  // be fixed and re-uploaded. xlsx is dynamically imported to keep it out of the
  // initial bundle.
  const downloadFailedRows = async () => {
    if (!result?.failedRows.length) return;
    setExporting(true);
    try {
      const XLSX = await import("xlsx");
      const ws = XLSX.utils.json_to_sheet(result.failedRows, {
        header: [...FAILED_COLUMNS],
      });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Failed milestones");
      XLSX.writeFile(wb, "failed-milestones.xlsx");
    } catch {
      toast.error("Could not generate the file");
    } finally {
      setExporting(false);
    }
  };

  const downloadTemplate = () => {
    const header = COLUMNS.map((c) => c.name).join(",");
    // Each example is keyed by column name; values are emitted in COLUMNS order
    // so they always line up with the header even as columns change.
    const examples: Record<string, string | number>[] = [
      { slug_id: "idfc-first-mayura--idfc", card_name: "IDFC First Mayura", milestone_type: "annual_spend", milestone_period: "annually", spend_threshold_inr: 800000, tier_order: 1, mutual_exclusivity_group: "mayura_annual", benefit_type: "points", benefit_value_inr: 6000, is_active: "true" },
      { slug_id: "idfc-first-mayura--idfc", card_name: "IDFC First Mayura", milestone_type: "annual_spend", milestone_period: "annually", spend_threshold_inr: 1500000, tier_order: 2, mutual_exclusivity_group: "mayura_annual", benefit_type: "points", benefit_value_inr: 15000, is_active: "true" },
      { slug_id: "axis-atlas--axis", card_name: "Axis Atlas", milestone_type: "milestone_spend", milestone_period: "annually", spend_threshold_inr: 750000, benefit_type: "membership", benefit_value_inr: 5000, is_active: "true" },
    ];
    const csvCell = (v: string | number) => {
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const example = examples
      .map((row) => COLUMNS.map((c) => csvCell(row[c.name] ?? "")).join(","))
      .join("\n");
    const blob = new Blob([`${header}\n${example}\n`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "milestones-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Choose a file first");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/advisor/milestones/bulk", {
        method: "POST",
        body: form,
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.message ?? "Upload failed");
        return;
      }
      const data = json.result as UploadResult;
      setResult(data);
      toast.success(
        `${data.inserted} added, ${data.replaced} updated across ${data.cardsAffected.length} card(s)` +
          (data.totalDropped ? `, ${data.totalDropped} dropped` : ""),
      );
    } catch {
      toast.error("Upload failed, please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl text-white">
      <div>
        <Typography variant="h3" className="font-semibold text-white">
          Bulk upload card milestones
        </Typography>
        <Typography variant="p" className="text-sm text-white/60 mt-1">
          Upload an Excel (.xlsx) or CSV file. Each row is{" "}
          <span className="text-primary-orange font-semibold">upserted</span> by
          (card, milestone_type, spend_threshold): an existing milestone for that
          combo is overwritten, a new combo is added, and the card&apos;s other
          milestones are left untouched.
        </Typography>
      </div>

      {/* Column spec */}
      <div className="rounded-xl border border-brown-border bg-brown-sidebar overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between border-b border-brown-border bg-brown-background/40">
          <Typography variant="p" className="font-medium text-sm text-white">
            Expected columns
          </Typography>
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="w-4 h-4" /> Template (CSV)
          </Button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-white/50 uppercase text-xs tracking-wide">
              <th className="px-4 py-2 font-medium">Column</th>
              <th className="px-4 py-2 font-medium">Required</th>
              <th className="px-4 py-2 font-medium">Description</th>
            </tr>
          </thead>
          <tbody>
            {COLUMNS.map((c) => (
              <tr
                key={c.name}
                className="border-t border-brown-border/60 align-top"
              >
                <td className="px-4 py-3 font-mono text-primary-orange whitespace-nowrap">
                  {c.name}
                </td>
                <td className="px-4 py-3">
                  {c.required ? (
                    <span className="text-tertiary-orange font-semibold">
                      required
                    </span>
                  ) : (
                    <span className="text-white/35">optional</span>
                  )}
                </td>
                <td className="px-4 py-3 text-white/65 leading-relaxed">
                  {c.desc}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Upload control */}
      <div className="rounded-xl border border-brown-border bg-brown-sidebar p-4 flex items-center gap-4 flex-wrap">
        <FileSpreadsheet className="w-8 h-8 text-primary-orange shrink-0" />
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="flex-1 min-w-[200px] text-sm text-white/70 file:mr-3 file:rounded-full file:border-0 file:bg-secondary-orange/40 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-secondary-orange/60 file:cursor-pointer cursor-pointer"
        />
        <Button onClick={handleUpload} disabled={loading || !file}>
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          Upload &amp; import
        </Button>
      </div>

      {/* Result */}
      {result && (
        <div className="rounded-xl border border-brown-border bg-brown-sidebar p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            {result.totalDropped > 0 ? (
              <AlertTriangle className="w-5 h-5 text-tertiary-orange" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-primary-success" />
            )}
            <Typography variant="p" className="font-semibold text-white">
              Import result
            </Typography>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Added (new)", value: result.inserted },
              { label: "Updated (replaced)", value: result.replaced },
              { label: "Dropped", value: result.totalDropped },
              { label: "Cards affected", value: result.cardsAffected.length },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-lg border border-brown-border bg-brown-background/40 px-3 py-2"
              >
                <div className="text-xl font-semibold text-white">{s.value}</div>
                <div className="text-xs text-white/50">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="text-xs text-white/45">
            {result.rowsInFile} rows in file · {result.written} written (
            {result.inserted} new + {result.replaced} replaced)
            {result.duplicateDropped > 0
              ? ` · ${result.duplicateDropped} duplicate (slug_id, milestone_type, spend_threshold_inr) row(s) dropped — see failed rows`
              : ""}
          </div>

          {/* Drop breakdown — accounts for every dropped row */}
          {result.dropReasons.length > 0 && (
            <div className="rounded-lg border border-tertiary-orange/40 bg-tertiary-orange/10 p-3">
              <Typography
                variant="p"
                className="font-medium text-sm text-tertiary-orange mb-2"
              >
                Why rows were dropped ({result.totalDropped} total)
              </Typography>
              <table className="w-full text-xs">
                <tbody>
                  {result.dropReasons.map((r) => (
                    <tr key={r.code} className="border-t border-tertiary-orange/20">
                      <td className="py-1.5 pr-3 text-white/70">
                        {REASON_LABELS[r.code] ?? r.code}
                      </td>
                      <td className="py-1.5 text-right font-semibold text-white tabular-nums">
                        {r.count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Missing card slugs (each drops ALL of that card's rows) */}
          {result.unknownSlugs.length > 0 && (
            <div className="text-xs text-white/70">
              <span className="text-tertiary-orange font-medium">
                {result.unknownSlugs.length} card slug(s) not found
              </span>{" "}
              (not seeded in advisor cards — every row for these was dropped):
              <div className="mt-1 text-white/50 break-words max-h-32 overflow-auto">
                {result.unknownSlugs.join(", ")}
              </div>
            </div>
          )}

          {result.cardsAffected.length > 0 && (
            <div className="text-xs text-white/45 break-words">
              <span className="text-white/60">Cards updated:</span>{" "}
              {result.cardsAffected.join(", ")}
            </div>
          )}

          {result.failedRows.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadFailedRows}
                  disabled={exporting}
                >
                  {exporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  Download failed rows (.xlsx)
                </Button>
                <span className="text-xs text-white/45">
                  {result.failedRows.length} row(s) with their reason — fix &amp; re-upload
                  {result.failedRowsTruncated ? " (list truncated)" : ""}
                </span>
              </div>

              <details className="text-xs text-white/70">
                <summary className="cursor-pointer text-white/60">
                  Preview first {Math.min(50, result.failedRows.length)}
                </summary>
                <ul className="list-disc pl-5 max-h-60 overflow-auto space-y-1 mt-1">
                  {result.failedRows.slice(0, 50).map((e, i) => (
                    <li key={i}>
                      <span className="text-white/45">Row {String(e.row)}: </span>
                      {String(e.reason)}
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MilestonesUpload;
