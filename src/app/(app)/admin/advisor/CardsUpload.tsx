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
import { TEMPLATE_COLUMNS } from "@/lib/advisor/bulkCards";

interface UploadResult {
  rowsInFile: number;
  inserted: number;
  replaced: number;
  written: number;
  duplicateDropped: number;
  totalDropped: number;
  blankRowsSkipped: number;
  validationDropped: number;
  cardsAffected: string[];
  dropReasons: { code: string; count: number }[];
  failedRows: Record<string, string | number>[];
  failedRowsTruncated: boolean;
}

const FAILED_COLUMNS = ["row", ...TEMPLATE_COLUMNS, "code", "reason"] as const;

const REASON_LABELS: Record<string, string> = {
  blank_row: "Blank rows (no data)",
  missing_card_id: "Missing card_id",
  missing_name: "Missing name",
  bad_number: "A numeric cell is not a number",
  unknown_category: "Unknown category in categories / excluded_categories",
  unknown_reward_type: "rewards.reward_type must be points / cashback / miles",
  unknown_welcome_type: "welcome_benefit.type must be points / voucher / cashback / miles / membership",
  bad_lounge: "Bad lounge column (period / program / a numeric cell)",
  duplicate: "Duplicate card_id — superseded by a later row",
};

// The expected columns, in template order. `required` marks the identity fields;
// everything else is optional and defaults sensibly.
const COLUMNS: { name: string; required: boolean; desc: string }[] = [
  { name: "card_id", required: true, desc: "Unique card id. Used as the slug (upsert identity), e.g. hdfc-regalia-gold." },
  { name: "name", required: true, desc: "Display name of the card, e.g. HDFC Regalia Gold." },
  { name: "product_type", required: false, desc: "Product type. Defaults to cc." },
  { name: "invitation_only", required: false, desc: "true / false / yes / no / 1 / 0. Defaults to false." },
  { name: "issuer", required: false, desc: "Issuer(s), | or , separated, e.g. HDFC Bank." },
  { name: "eligibility.min_salary_inr", required: false, desc: "Min salaried income (₹). Defaults to 0." },
  { name: "eligibility.min_self_employed_income_inr", required: false, desc: "Min self-employed income (₹). Defaults to 0." },
  { name: "eligibility.min_age", required: false, desc: "Min age. Defaults to 0." },
  { name: "eligibility.max_age", required: false, desc: "Max age. Defaults to 0." },
  { name: "fees.joining_inr", required: false, desc: "Joining fee (₹). Defaults to 0." },
  { name: "fees.joining_gst_inr", required: false, desc: "GST on joining fee (₹). Defaults to 0." },
  { name: "fees.annual_inr", required: false, desc: "Annual fee (₹). Defaults to 0." },
  { name: "fees.annual_gst_inr", required: false, desc: "GST on annual fee (₹). Defaults to 0." },
  { name: "fees.waiver_spend_inr", required: false, desc: "Annual-fee waiver spend threshold (₹). Defaults to 0." },
  { name: "fees.joining_waiver_spend_inr", required: false, desc: "Joining-fee waiver spend threshold (₹). Defaults to 0." },
  { name: "fees.joining_fee_waiver_days", required: false, desc: "Days to spend for joining-fee waiver. Blank = none (null)." },
  { name: "fees.is_lifetime_free", required: false, desc: "true / false. Defaults to false." },
  { name: "forex_markup_percentage", required: false, desc: "Forex markup %. Defaults to 0." },
  { name: "rewards.base_reward_rate", required: false, desc: "Base reward rate. Defaults to 0." },
  { name: "rewards.point_value_inr", required: false, desc: "Value of 1 point (₹). Defaults to 0." },
  { name: "rewards.points_expiry_months", required: false, desc: "Points expiry in months. Blank = never (null)." },
  { name: "rewards.reward_type", required: false, desc: "One of points / cashback / miles. Defaults to points." },
  { name: "categories", required: false, desc: "Earn categories, | or , separated (snake_case, e.g. dining|fuel). Each must be a known category." },
  { name: "excluded_categories", required: false, desc: "Excluded categories, | or , separated. Each must be a known category." },
  { name: "welcome_benefit.type", required: false, desc: "points / voucher / cashback / miles / membership. Blank = no welcome benefit (the other welcome_benefit.* cells are then ignored)." },
  { name: "welcome_benefit.value_inr", required: false, desc: "Welcome benefit value (₹). Defaults to 0." },
  { name: "welcome_benefit.condition", required: false, desc: "Free-text condition for the welcome benefit." },
  { name: "welcome_benefit.expires_in_months", required: false, desc: "Welcome benefit expiry in months. Defaults to 0." },
  { name: "welcome_benefit.display", required: false, desc: "Display text for the welcome benefit." },
  { name: "lounge.domestic.visitsPerPeriod", required: false, desc: "Domestic lounge visits per period. Blank = no domestic lounge access (the other lounge.domestic.* cells are then ignored)." },
  { name: "lounge.domestic.period", required: false, desc: "quarter / year. Defaults to year." },
  { name: "lounge.domestic.annualCap", required: false, desc: "Annual cap on domestic visits. Defaults to 0." },
  { name: "lounge.domestic.spendCondition.thresholdInr", required: false, desc: "Spend threshold (₹) to unlock domestic lounge. Blank = no spend condition." },
  { name: "lounge.domestic.spendCondition.windowMonths", required: false, desc: "Window (months) for the domestic spend condition. Defaults to 0." },
  { name: "lounge.domestic.membershipRequired", required: false, desc: "Membership required for domestic lounge. Blank = none (null)." },
  { name: "lounge.domestic.program", required: false, desc: "issuer / priority_pass / dreamfolks / loungekey. Defaults to issuer." },
  { name: "lounge.domestic.display", required: false, desc: "Display text for domestic lounge access." },
  { name: "lounge.international.visitsPerPeriod", required: false, desc: "International lounge visits per period. Blank = no international lounge access." },
  { name: "lounge.international.period", required: false, desc: "quarter / year. Defaults to year." },
  { name: "lounge.international.annualCap", required: false, desc: "Annual cap on international visits. Defaults to 0." },
  { name: "lounge.international.spendCondition.thresholdInr", required: false, desc: "Spend threshold (₹) to unlock international lounge. Blank = no spend condition." },
  { name: "lounge.international.spendCondition.windowMonths", required: false, desc: "Window (months) for the international spend condition. Defaults to 0." },
  { name: "lounge.international.membershipRequired", required: false, desc: "Membership required for international lounge. Blank = none (null)." },
  { name: "lounge.international.program", required: false, desc: "issuer / priority_pass / dreamfolks / loungekey. Defaults to issuer." },
  { name: "lounge.international.display", required: false, desc: "Display text for international lounge access." },
  { name: "ideal_for", required: false, desc: "Who the card is ideal for. Each entry is a full sentence; separate entries with || (double pipe)." },
  { name: "not_ideal_for", required: false, desc: "Who the card is not ideal for. Each entry is a full sentence; separate entries with || (double pipe)." },
  { name: "miles_and_hotel_transfer_available", required: false, desc: "true / false. Defaults to false." },
  { name: "miles_and_hotel_partners", required: false, desc: "Transfer partners, | or , separated." },
  { name: "max_value_on_transfer", required: false, desc: "Max value on transfer note(s), | or , separated." },
  { name: "is_active", required: false, desc: "true / false. Defaults to true (blank = active)." },
];

const CardsUpload = () => {
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
      XLSX.writeFile(wb, "failed-cards.xlsx");
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
      {
        card_id: "hdfc-regalia-gold",
        name: "HDFC Regalia Gold",
        product_type: "cc",
        invitation_only: "false",
        issuer: "HDFC Bank",
        "eligibility.min_salary_inr": 1200000,
        "eligibility.min_age": 21,
        "eligibility.max_age": 60,
        "fees.joining_inr": 2500,
        "fees.annual_inr": 2500,
        "fees.waiver_spend_inr": 400000,
        "fees.is_lifetime_free": "false",
        forex_markup_percentage: 2,
        "rewards.base_reward_rate": 4,
        "rewards.point_value_inr": 0.5,
        "rewards.reward_type": "points",
        categories: "dining|fuel|online_shopping",
        excluded_categories: "rent|fees_taxes",
        "welcome_benefit.type": "voucher",
        "welcome_benefit.value_inr": 2500,
        "welcome_benefit.condition": "On first swipe within 90 days",
        "welcome_benefit.expires_in_months": 3,
        "welcome_benefit.display": "₹2,500 voucher on first spend",
        "lounge.domestic.visitsPerPeriod": 12,
        "lounge.domestic.period": "year",
        "lounge.domestic.annualCap": 12,
        "lounge.domestic.program": "priority_pass",
        "lounge.domestic.display": "12 domestic lounge visits / year",
        "lounge.international.visitsPerPeriod": 6,
        "lounge.international.period": "year",
        "lounge.international.annualCap": 6,
        "lounge.international.program": "priority_pass",
        "lounge.international.display": "6 international lounge visits / year",
        ideal_for:
          "Ideal for frequent travellers who value 12 domestic lounge visits a year.||Great for dining spenders earning 4X points on restaurants.",
        not_ideal_for: "Not ideal for those who spend mostly on rent and utilities.",
        miles_and_hotel_transfer_available: "true",
        miles_and_hotel_partners: "Air India|Marriott",
        max_value_on_transfer: "Up to 1:1 on select partners",
        is_active: "true",
      },
      {
        card_id: "axis-magnus",
        name: "Axis Magnus",
        issuer: "Axis Bank",
        "rewards.base_reward_rate": 4.8,
        "rewards.reward_type": "points",
        categories: "travel|dining",
      },
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
    a.download = "cards-template.csv";
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
      const res = await fetch("/api/admin/advisor/cards/bulk", {
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
          Bulk upload cards
        </Typography>
        <Typography variant="p" className="text-sm text-white/60 mt-1">
          Upload an Excel (.xlsx) or CSV file. Each row is{" "}
          <span className="text-primary-orange font-semibold">upserted</span> by{" "}
          <span className="font-mono">card_id</span>: an existing card is
          overwritten, a new one is added. bestOf is recomputed automatically.
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
        <div className="max-h-96 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-brown-sidebar">
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
              ? ` · ${result.duplicateDropped} duplicate card_id row(s) dropped — see failed rows`
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

export default CardsUpload;
