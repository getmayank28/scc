import * as XLSX from "xlsx";
import { ApiResponse } from "@/lib/utils/ApiResponse";
import { requireAdmin } from "@/lib/advisor/adminAuth";
import dbConnect from "@/lib/utils/dbConnet";
import CardMilestoneModel from "@/models/CardMilestone";
import CardAdvisorModel from "@/models/Card";
import { AdvisorCache } from "@/lib/advisor/cache";
import {
  mapHeader,
  normalizeRow,
  milestoneToDoc,
  milestoneKeyFor,
  TEMPLATE_COLUMNS,
  type RawMilestoneRow,
  type RowError,
  type NormalizedMilestone,
} from "@/lib/advisor/bulkMilestones";

export const runtime = "nodejs";

// POST — bulk upload card milestones from an .xlsx/.csv file (multipart form,
// field "file").
//
// Behaviour: PER-MILESTONE UPSERT (no card wipe). Each row is upserted by its
// (card, milestone_type, spend_threshold_inr) identity — an existing milestone
// for that combo is overwritten in place, a new combo is inserted, and every
// other milestone on the card is left untouched. Duplicate combos within one
// file collapse (last wins). Milestones do not feed the bestOf frontier, so no
// recompute is run; the advisor read cache is invalidated so fresh reads pick
// up the new rows.
export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  // ---- read the uploaded file ----
  let file: File | null = null;
  try {
    const form = await req.formData();
    const f = form.get("file");
    if (f instanceof File) file = f;
  } catch {
    return ApiResponse.error("Expected multipart/form-data with a 'file' field", 400);
  }
  if (!file) return ApiResponse.error("No file uploaded (field 'file')", 400);

  // ---- parse the sheet into raw rows ----
  let matrix: unknown[][];
  let physicalDataRows = 0;
  try {
    const buf = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buf, { type: "buffer", cellDates: true });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    if (!sheet) return ApiResponse.error("Workbook has no sheets", 400);
    // Physical data-row count from the sheet's declared range (incl. blanks),
    // so we can report how many fully-blank rows the parser dropped.
    const range = sheet["!ref"] ? XLSX.utils.decode_range(sheet["!ref"]) : null;
    physicalDataRows = range ? Math.max(0, range.e.r - range.s.r) : 0;
    matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: "" });
  } catch (err) {
    console.error("[admin/milestones/bulk] parse failed:", err);
    return ApiResponse.error("Could not parse the file as a spreadsheet", 400);
  }

  if (matrix.length < 2) {
    return ApiResponse.error("File must have a header row and at least one data row", 400);
  }

  // ---- map headers -> canonical fields ----
  const headerRow = matrix[0].map((c) => String(c ?? ""));
  const colMap = headerRow.map(mapHeader); // index -> field | null
  if (!colMap.includes("slug_id")) {
    return ApiResponse.error(
      "Header row must include at least: slug_id",
      400,
    );
  }

  // A failed-row record = the original column values + why it was dropped.
  // Exactly the shape we write back into the downloadable error report, so the
  // admin can fix the offending cells and re-upload.
  const str = (v: unknown) => (v === undefined || v === null ? "" : String(v));
  const FAILED_CAP = 50_000;
  const failedRows: Record<string, string | number>[] = [];
  const pushFailed = (
    raw: Record<string, unknown>,
    row: number,
    code: string,
    reason: string,
  ) => {
    if (failedRows.length >= FAILED_CAP) return;
    // Echo back every original column (so the admin can fix the offending cell
    // and re-upload the same sheet) plus the row number, drop code and reason.
    const record: Record<string, string | number> = { row };
    for (const col of TEMPLATE_COLUMNS) record[col] = str(raw[col]);
    record.code = code;
    record.reason = reason;
    failedRows.push(record);
  };

  // ---- normalize each data row ----
  const errors: RowError[] = [];
  // Keep the original raw cells + sheet row alongside each valid milestone, so a
  // row later rejected for an unknown slug can still be written to the report.
  const valid: {
    milestone: NormalizedMilestone;
    raw: Record<string, unknown>;
    row: number;
  }[] = [];
  for (let i = 1; i < matrix.length; i++) {
    const cells = matrix[i];
    const raw: Record<string, unknown> = {};
    colMap.forEach((field, idx) => {
      if (field) raw[field] = cells[idx];
    });
    const sheetRow = i + 1; // 1-based incl. header
    const res = normalizeRow(raw as RawMilestoneRow, sheetRow);
    if (res.ok) valid.push({ milestone: res.milestone, raw, row: sheetRow });
    else {
      errors.push(res.error);
      pushFailed(raw, res.error.row, res.error.code, res.error.message);
    }
  }

  // ---- de-dupe by identity (slug, milestone_type, spend_threshold); last wins ----
  // Earlier rows for the same identity are DROPPED (reported in failedRows so the
  // admin can see exactly which rows were superseded), not silently collapsed.
  const identityOf = (m: NormalizedMilestone) =>
    `${m.cardSlug}__${m.milestone_type ?? "_notype"}__${m.spend_threshold_inr ?? "_nothreshold"}`;
  const dedupMap = new Map<
    string,
    { milestone: NormalizedMilestone; raw: Record<string, unknown>; row: number }
  >();
  for (const v of valid) {
    const id = identityOf(v.milestone);
    const prev = dedupMap.get(id);
    if (prev) {
      pushFailed(
        prev.raw,
        prev.row,
        "duplicate",
        `Duplicate (slug_id, milestone_type, spend_threshold_inr) — superseded by row ${v.row}`,
      );
    }
    dedupMap.set(id, v);
  }
  const deduped = [...dedupMap.values()];
  const duplicateDropped = valid.length - deduped.length;

  // ---- resolve slugs against known cards ----
  try {
    await dbConnect();

    const slugs = [...new Set(deduped.map((v) => v.milestone.cardSlug))];
    const cards = await CardAdvisorModel.find({
      slug: { $in: slugs },
    })
      .select("slug")
      .lean<{ slug: string }[]>();
    const knownSlugs = new Set(cards.map((c) => c.slug));

    // Unknown card slug: count every affected ROW (not just the distinct slug),
    // and tally per-slug so the admin can see exactly which cards are missing.
    const unknownSlugs = slugs.filter((s) => !knownSlugs.has(s));
    const unknownSlugRowCounts = new Map<string, number>();

    // Group importable milestones by card slug.
    const byCard = new Map<string, NormalizedMilestone[]>();
    for (const v of deduped) {
      if (!knownSlugs.has(v.milestone.cardSlug)) {
        unknownSlugRowCounts.set(
          v.milestone.cardSlug,
          (unknownSlugRowCounts.get(v.milestone.cardSlug) ?? 0) + 1,
        );
        pushFailed(
          v.raw,
          v.row,
          "unknown_slug",
          `Unknown card slug "${v.milestone.cardSlug}" — not found in advisor cards`,
        );
        continue;
      }
      const arr = byCard.get(v.milestone.cardSlug) ?? [];
      arr.push(v.milestone);
      byCard.set(v.milestone.cardSlug, arr);
    }
    const unknownSlugRows = [...unknownSlugRowCounts.values()].reduce((a, b) => a + b, 0);

    // ---- per-milestone upsert (NO card wipe) ----
    // Identity = (slug, milestone_type, spend_threshold) -> milestoneKey. The
    // rows are already de-duped by that identity above, so every op in a card's
    // batch is a distinct milestoneKey. An existing combo is overwritten; a new
    // combo inserted; the card's other milestones are untouched.
    let inserted = 0; // newly created (upserted)
    let replaced = 0; // matched an existing milestone combo and overwrote it
    const cardsAffected: string[] = [];
    for (const [cardSlug, milestones] of byCard) {
      const ops = milestones.map((m) => {
        const milestoneKey = milestoneKeyFor(
          cardSlug,
          m.milestone_type,
          m.spend_threshold_inr,
        );
        const { milestoneKey: _k, ...rest } = milestoneToDoc(m, cardSlug, milestoneKey);
        void _k;
        return {
          updateOne: {
            filter: { milestoneKey },
            update: { $set: rest },
            upsert: true,
          },
        };
      });

      if (ops.length) {
        const res = await CardMilestoneModel.bulkWrite(ops, { ordered: false });
        const newlyInserted = res.upsertedCount ?? 0;
        inserted += newlyInserted;
        // Anything that wasn't a fresh insert matched an existing milestone combo.
        replaced += ops.length - newlyInserted;
      }

      cardsAffected.push(cardSlug);
    }

    // Milestones don't feed the bestOf frontier, so no recompute is needed —
    // just invalidate the read cache so fresh reads see the new rows.
    if (cardsAffected.length) AdvisorCache.invalidate();

    // ---- reconcile counts so every dropped row is accounted for ----
    const parsedDataRows = matrix.length - 1; // after blank-row removal
    const blankRowsSkipped = Math.max(0, physicalDataRows - parsedDataRows);

    // Tally validation drops by reason code.
    const reasonCounts: Record<string, number> = {};
    for (const e of errors) {
      reasonCounts[e.code] = (reasonCounts[e.code] ?? 0) + 1;
    }
    if (blankRowsSkipped > 0) reasonCounts["blank_row"] = blankRowsSkipped;
    if (unknownSlugRows > 0) reasonCounts["unknown_slug"] = unknownSlugRows;
    if (duplicateDropped > 0) reasonCounts["duplicate"] = duplicateDropped;

    const dropReasons = Object.entries(reasonCounts)
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count);

    // Every row in the file is one of: written (inserted | replaced) or dropped.
    // Dropped = blank + validation + unknown slug + duplicate-superseded.
    // rowsInFile = inserted + replaced + totalDropped.
    const totalDropped =
      blankRowsSkipped + errors.length + unknownSlugRows + duplicateDropped;

    return ApiResponse.success("Upload processed", 200, {
      rowsInFile: physicalDataRows, // data rows (excl. header), incl. blanks
      inserted, // new (slug, milestone_type, spend_threshold) combos created
      replaced, // existing combos overwritten in place
      written: inserted + replaced,
      duplicateDropped, // earlier rows superseded by a same-identity later row
      totalDropped,
      blankRowsSkipped,
      validationDropped: errors.length,
      unknownSlugRows,
      cardsAffected,
      dropReasons, // [{ code, count }] sorted desc — accounts for every dropped row
      unknownSlugs, // distinct card slugs not found in advisor cards
      failedRows, // every dropped row (orig. columns + reason) for download
      failedRowsTruncated: failedRows.length >= FAILED_CAP,
    });
  } catch (err) {
    console.error("[admin/milestones/bulk] import failed:", err);
    return ApiResponse.error("Failed to import milestones", 500);
  }
}
