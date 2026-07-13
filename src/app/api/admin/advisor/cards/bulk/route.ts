import * as XLSX from "xlsx";
import { ApiResponse } from "@/lib/utils/ApiResponse";
import { requireAdmin } from "@/lib/advisor/adminAuth";
import dbConnect from "@/lib/utils/dbConnet";
import CardAdvisorModel from "@/models/CardDoc";
import { recomputeBestOfForCard } from "@/lib/advisor/recompute";
import { AdvisorCache } from "@/lib/advisor/cache";
import {
  mapHeader,
  normalizeCardRow,
  cardToDoc,
  TEMPLATE_COLUMNS,
  type RawCardRow,
  type ColumnName,
  type RowError,
  type NormalizedCard,
} from "@/lib/advisor/bulkCards";

export const runtime = "nodejs";

// POST — bulk upload cards from an .xlsx/.csv file (multipart form, field "file").
//
// Behaviour: UPSERT by advisorKey (= card_id). Each row is upserted — an existing
// card with that advisorKey is overwritten in place, a new one is inserted.
// Duplicate card_ids within one file collapse (last wins; the earlier row is
// reported as dropped). After import each affected card's bestOf cache is
// recomputed and the read cache invalidated.
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
    console.error("[admin/cards/bulk] parse failed:", err);
    return ApiResponse.error("Could not parse the file as a spreadsheet", 400);
  }

  if (matrix.length < 2) {
    return ApiResponse.error("File must have a header row and at least one data row", 400);
  }

  // ---- map headers -> canonical columns ----
  const headerRow = matrix[0].map((c) => String(c ?? ""));
  const colMap = headerRow.map(mapHeader); // index -> column | null
  if (!colMap.includes("card_id") || !colMap.includes("name")) {
    return ApiResponse.error(
      "Header row must include at least: card_id, name",
      400,
    );
  }

  // A failed-row record = the original column values + why it was dropped.
  // Exactly the shape we write back into the downloadable error report.
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
    const record: Record<string, string | number> = { row };
    for (const col of TEMPLATE_COLUMNS) record[col] = str(raw[col]);
    record.code = code;
    record.reason = reason;
    failedRows.push(record);
  };

  // ---- normalize each data row ----
  const errors: RowError[] = [];
  const valid: { card: NormalizedCard; raw: Record<string, unknown>; row: number }[] = [];
  for (let i = 1; i < matrix.length; i++) {
    const cells = matrix[i];
    const raw: Record<string, unknown> = {};
    colMap.forEach((col, idx) => {
      if (col) raw[col] = cells[idx];
    });
    const sheetRow = i + 1; // 1-based incl. header
    const res = normalizeCardRow(raw as RawCardRow, sheetRow);
    if (res.ok) valid.push({ card: res.card, raw, row: sheetRow });
    else {
      errors.push(res.error);
      pushFailed(raw, res.error.row, res.error.code, res.error.message);
    }
  }

  // ---- de-dupe by advisorKey; last occurrence wins ----
  // Earlier rows for the same card_id are DROPPED (reported so the admin can see
  // which rows were superseded).
  const dedupMap = new Map<
    string,
    { card: NormalizedCard; raw: Record<string, unknown>; row: number }
  >();
  for (const v of valid) {
    const prev = dedupMap.get(v.card.advisorKey);
    if (prev) {
      pushFailed(
        prev.raw,
        prev.row,
        "duplicate",
        `Duplicate card_id "${v.card.advisorKey}" — superseded by row ${v.row}`,
      );
    }
    dedupMap.set(v.card.advisorKey, v);
  }
  const deduped = [...dedupMap.values()];
  const duplicateDropped = valid.length - deduped.length;

  // ---- upsert by advisorKey ----
  try {
    await dbConnect();

    // Which advisorKeys already exist (so we can report inserted vs replaced
    // deterministically — bulkWrite's upsertedCount alone is enough, but we
    // also want the affected-cards list).
    let inserted = 0;
    let replaced = 0;
    const cardsAffected: string[] = [];

    if (deduped.length) {
      const ops = deduped.map((v) => ({
        updateOne: {
          filter: { advisorKey: v.card.advisorKey },
          // On a fresh insert, seed rulesVersion; on update, leave it (rules
          // aren't touched here). setOnInsert avoids resetting it on replace.
          update: {
            $set: cardToDoc(v.card),
            $setOnInsert: { advisorKey: v.card.advisorKey, rulesVersion: 1 },
          },
          upsert: true,
        },
      }));

      const res = await CardAdvisorModel.bulkWrite(ops, { ordered: false });
      inserted = res.upsertedCount ?? 0;
      replaced = ops.length - inserted;

      // Recompute bestOf per affected card so newly-uploaded card metadata is
      // reflected in the advisor's read model.
      for (const v of deduped) {
        try {
          await recomputeBestOfForCard(v.card.advisorKey);
        } catch (err) {
          console.error(
            `[admin/cards/bulk] recompute failed for ${v.card.advisorKey}:`,
            err,
          );
        }
        cardsAffected.push(v.card.advisorKey);
      }
    }

    if (cardsAffected.length) AdvisorCache.invalidate();

    // ---- reconcile counts so every dropped row is accounted for ----
    const parsedDataRows = matrix.length - 1; // after blank-row removal
    const blankRowsSkipped = Math.max(0, physicalDataRows - parsedDataRows);

    const reasonCounts: Record<string, number> = {};
    for (const e of errors) {
      reasonCounts[e.code] = (reasonCounts[e.code] ?? 0) + 1;
    }
    if (blankRowsSkipped > 0) reasonCounts["blank_row"] = blankRowsSkipped;
    if (duplicateDropped > 0) reasonCounts["duplicate"] = duplicateDropped;

    const dropReasons = Object.entries(reasonCounts)
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count);

    // Every row: written (inserted | replaced) or dropped
    // (blank + validation + duplicate-superseded).
    const totalDropped = blankRowsSkipped + errors.length + duplicateDropped;

    return ApiResponse.success("Upload processed", 200, {
      rowsInFile: physicalDataRows,
      inserted,
      replaced,
      written: inserted + replaced,
      duplicateDropped,
      totalDropped,
      blankRowsSkipped,
      validationDropped: errors.length,
      cardsAffected,
      dropReasons,
      failedRows,
      failedRowsTruncated: failedRows.length >= FAILED_CAP,
    });
  } catch (err) {
    console.error("[admin/cards/bulk] import failed:", err);
    return ApiResponse.error("Failed to import cards", 500);
  }
}
