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
import { TEMPLATE_COLUMNS } from "@/lib/advisor/bulkRules";

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
  missing_slug: "Missing slug",
  missing_category: "Missing category",
  unknown_category: "Unknown category",
  unknown_merchant: "Unknown merchant (use the MERCHANTS key, not a label)",
  bad_number: "A numeric cell is not a number",
  bad_reward_cap: "Bad reward_cap (value/period/metric/scope)",
  bad_direct_swipe_schedule: "Bad direct_swipe_schedule (mode/period/value)",
  bad_shared_cap_group: "Bad shared_cap_group",
  unknown_redemption_mode: "redemption_mode must be online / offline / both",
  unknown_slug: "Card slug not found in advisor cards",
  duplicate: "Duplicate (slug, category, merchant, partner) — superseded by a later row",
};

const COLUMNS: { name: string; required: boolean; desc: string }[] = [
  { name: "slug", required: true, desc: "Card slug → cardId, e.g. reliance-sbi-card-prime--sbi. Used to find the card." },
  { name: "category", required: true, desc: "Spend category, e.g. Offline_Food_Dining, Travel - Cabs, Fuel. Case/spacing-insensitive; must resolve to a known category." },
  { name: "merchant", required: false, desc: "Merchant key (snake_case) e.g. air_india, bpcl, ajio. Leave blank for a base/category rule. Must exist in MERCHANTS." },
  { name: "direct_swipe_percentage", required: false, desc: "Effective % return on direct swipe. May be negative (e.g. forex -4.13). Defaults to 0." },
  { name: "voucher_discount_percentage", required: false, desc: "Voucher discount %. Defaults to 0." },
  { name: "voucher_reward_percentage", required: false, desc: "Voucher reward %. Defaults to 0." },
  { name: "convenience_fee_percentage", required: false, desc: "Convenience fee %. Defaults to 0." },
  { name: "voucher_monthly_purchase_limit_inr", required: false, desc: "Monthly voucher purchase limit (₹). Blank = no limit." },
  { name: "max_voucher_size_inr", required: false, desc: "Max single voucher size (₹). Blank = no limit." },
  { name: "vouchers_per_booking", required: false, desc: "Max vouchers per booking. Blank = no limit." },
  { name: "voucher_validity_in_months", required: false, desc: "Voucher validity in months. Blank = none." },
  { name: "fuel_surcharge_applicable", required: false, desc: "Fuel surcharge waiver %. Defaults to 0." },
  { name: "max_fuel_transaction_limit", required: false, desc: "Max fuel transaction limit (₹). Defaults to 0." },
  { name: "redemption_mode", required: false, desc: 'One of online / offline / both. Defaults to both.' },
  { name: "gv_coins_percentage", required: false, desc: "GV coins %. Defaults to 0." },
  { name: "shared_cap_group", required: false, desc: 'Single token "multiplier:merchant:capType" (parts in any order, e.g. 10:amazon:combined, 10:card:combined, 5:standalone). Use the literal "card" in the merchant slot for a card-level pool, or "total" for a card-total pool that earns 0 once its cap is exhausted (instead of the card base rate). capType is "combined" (pools across rules sharing the multiplier/merchant on the card) or "standalone"; defaults to combined. Blank = none.' },
  { name: "reward_cap_period", required: false, desc: "daily / monthly / quarterly / annually. Defaults to monthly when a reward_cap_value is set." },
  { name: "reward_cap_metric", required: false, desc: "points / inr / cashback. Defaults to points when a reward_cap_value is set." },
  { name: "reward_cap_value", required: false, desc: "The cap amount. The reward cap is only created when this is set; blank = no cap." },
  { name: "reward_cap_scope", required: false, desc: "merchant / category / card. Defaults to card when a reward_cap_value is set." },
  { name: "direct_swipe_schedule_mode", required: false, desc: 'marginal / whole. Defaults to marginal when a schedule value is set.' },
  { name: "direct_swipe_schedule_period", required: false, desc: "daily / monthly / quarterly / annually. Defaults to monthly when a schedule value is set." },
  { name: "direct_swipe_schedule_value", required: false, desc: 'Comma-separated "rate:minSpend" tiers, lowest starting at 0 — e.g. "3:0,10:20000" (3% up to ₹20k/period, 10% beyond). Blank = flat direct_swipe_percentage.' },
  { name: "partner", required: false, desc: "Free-form partner label, e.g. a co-brand or network partner. Blank = none." },
];

const RulesUpload = () => {
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
      XLSX.utils.book_append_sheet(wb, ws, "Failed rows");
      XLSX.writeFile(wb, "failed-rules.xlsx");
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
      { slug: "reliance-sbi-card-prime--sbi", category: "Offline_Food_Dining", direct_swipe_percentage: 1.25 },
      { slug: "reliance-sbi-card-prime--sbi", category: "Online Shopping", merchant: "ajio", direct_swipe_percentage: 5, shared_cap_group: "5:ajio:combined", reward_cap_value: 1000, reward_cap_period: "monthly", reward_cap_metric: "points", reward_cap_scope: "merchant" },
      { slug: "reliance-sbi-card-prime--sbi", category: "Education", direct_swipe_schedule_mode: "marginal", direct_swipe_schedule_period: "monthly", direct_swipe_schedule_value: "3:0,10:20000" },
      { slug: "reliance-sbi-card-prime--sbi", category: "Forex Charge", direct_swipe_percentage: -4.13 },
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
    a.download = "rules-template.csv";
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
      const res = await fetch("/api/admin/advisor/rules/bulk", {
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
          Bulk upload advisor rules
        </Typography>
        <Typography variant="p" className="text-sm text-white/60 mt-1">
          Upload an Excel (.xlsx) or CSV file. Each row is{" "}
          <span className="text-primary-orange font-semibold">upserted</span> by
          (card, category, merchant): an existing rule for that combo is
          overwritten, a new combo is added, and the card&apos;s other rules are
          left untouched. bestOf is recomputed automatically.
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
              ? ` · ${result.duplicateDropped} duplicate (slug, category, merchant) row(s) dropped — see failed rows`
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

export default RulesUpload;
