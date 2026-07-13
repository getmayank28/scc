// Pure helpers for the admin "bulk milestones upload" flow: normalise
// spreadsheet rows into CardMilestone documents. Kept free of Mongo/IO so it can
// be unit-tested and reused by the API route.
//
// Every enum field (milestone_period, benefit_type) is validated against the
// CardMilestoneDoc unions; a row whose cell falls outside the matching type is
// REJECTED (reported in the failed-row report) and not written to the DB — the
// rest of the file still imports.
//
// Required columns: slug_id (the card slug). Everything else is optional and
// falls back to a sensible default (null for nullable fields, is_active -> true).
// card_name / crad_id are read only so they can round-trip into the failed-row
// report; they are NOT written to the document.

// "One_Time" -> "one_time", "Half Yearly" -> "half_yearly"
export function normalizeKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

type MilestonePeriod =
  | "one_time"
  | "daily"
  | "quarterly"
  | "halfyearly"
  | "annually";
type BenefitType = "points" | "cashback" | "membership" | "voucher";

const MILESTONE_PERIODS = new Set<MilestonePeriod>([
  "one_time",
  "daily",
  "quarterly",
  "halfyearly",
  "annually",
]);
const BENEFIT_TYPES = new Set<BenefitType>([
  "points",
  "cashback",
  "membership",
  "voucher",
]);

// Common phrasings mapped onto the canonical period keys.
const PERIOD_ALIASES: Record<string, MilestonePeriod> = {
  one_time: "one_time",
  onetime: "one_time",
  once: "one_time",
  daily: "daily",
  quarterly: "quarterly",
  quarter: "quarterly",
  halfyearly: "halfyearly",
  half_yearly: "halfyearly",
  semiannually: "halfyearly",
  annually: "annually",
  annual: "annually",
  yearly: "annually",
};

// The canonical columns we read. Everything else in the sheet is ignored.
type Cell = string | number | boolean | null | undefined;
export interface RawMilestoneRow {
  slug_id?: Cell;
  card_name?: Cell;
  crad_id?: Cell;
  milestone_type?: Cell;
  milestone_period?: Cell;
  spend_threshold_inr?: Cell;
  tier_order?: Cell;
  mutual_exclusivity_group?: Cell;
  benefit_type?: Cell;
  benefit_value_inr?: Cell;
  is_active?: Cell;
}

export interface NormalizedMilestone {
  cardSlug: string;
  milestone_type: string | null;
  milestone_period: MilestonePeriod | null;
  spend_threshold_inr: number | null;
  tier_order: number | null;
  mutual_exclusivity_group: string | null;
  benefit_type: BenefitType | null;
  benefit_value_inr: number | null;
  is_active: boolean;
}

export type DropCode =
  | "missing_slug"
  | "unknown_period"
  | "unknown_benefit_type"
  | "bad_number"
  | "unknown_slug";

export interface RowError {
  row: number; // 1-based, matching the spreadsheet (header = row 1)
  message: string;
  code: DropCode;
}

// The canonical column list, surfaced in the UI / template / failed-row report.
// Order here is the order columns appear in the downloadable template.
export const TEMPLATE_COLUMNS = [
  "slug_id",
  "card_name",
  "crad_id",
  "milestone_type",
  "milestone_period",
  "spend_threshold_inr",
  "tier_order",
  "mutual_exclusivity_group",
  "benefit_type",
  "benefit_value_inr",
  "is_active",
] as const;

// Header aliases -> canonical field. Compared after normalizeKey(). The exact
// snake_case column names map to themselves; a few common synonyms are added.
const HEADER_ALIASES: Record<string, keyof RawMilestoneRow> = {
  ...Object.fromEntries(
    TEMPLATE_COLUMNS.map((c) => [c, c as keyof RawMilestoneRow]),
  ),
  slug: "slug_id",
  card_slug: "slug_id",
  card_id: "crad_id",
  cardid: "crad_id",
  card: "card_name",
};

export function mapHeader(rawHeader: string): keyof RawMilestoneRow | null {
  return HEADER_ALIASES[normalizeKey(rawHeader)] ?? null;
}

// ---- cell parsers ----------------------------------------------------------

const isBlank = (v: Cell): boolean =>
  v === undefined || v === null || String(v).trim() === "";

// A numeric cell. Blank -> null (caller decides the default). Non-numeric ->
// error.
function parseNum(
  raw: Cell,
  label: string,
): number | null | { error: string } {
  if (isBlank(raw)) return null;
  const n = Number(String(raw).trim());
  if (!Number.isFinite(n)) return { error: `${label} "${raw}" is not a number` };
  return n;
}

// A boolean cell. Blank -> defaults to true (matches the model default).
// Accepts true/false, yes/no, y/n, 1/0, active/inactive.
function parseBool(raw: Cell): boolean {
  if (isBlank(raw)) return true;
  const s = String(raw).trim().toLowerCase();
  return !["false", "no", "n", "0", "inactive", "off"].includes(s);
}

// Validate + convert a single raw row. `rowNumber` is the 1-based sheet row
// (used only for error reporting). Returns either a normalized milestone or an
// error.
export function normalizeRow(
  raw: RawMilestoneRow,
  rowNumber: number,
): { ok: true; milestone: NormalizedMilestone } | { ok: false; error: RowError } {
  const fail = (code: DropCode, message: string) =>
    ({ ok: false as const, error: { row: rowNumber, message, code } });

  // ---- required: slug_id ----
  const slug = String(raw.slug_id ?? "").trim();
  if (!slug) return fail("missing_slug", "Missing slug_id");

  // ---- milestone_type (optional free text) ----
  const milestone_type = isBlank(raw.milestone_type)
    ? null
    : String(raw.milestone_type).trim();

  // ---- milestone_period (optional enum) ----
  let milestone_period: MilestonePeriod | null = null;
  if (!isBlank(raw.milestone_period)) {
    const p = PERIOD_ALIASES[normalizeKey(String(raw.milestone_period))];
    if (!p || !MILESTONE_PERIODS.has(p)) {
      return fail(
        "unknown_period",
        `milestone_period "${raw.milestone_period}" must be one of ${[...MILESTONE_PERIODS].join(", ")}`,
      );
    }
    milestone_period = p;
  }

  // ---- benefit_type (optional enum) ----
  let benefit_type: BenefitType | null = null;
  if (!isBlank(raw.benefit_type)) {
    const b = normalizeKey(String(raw.benefit_type)) as BenefitType;
    if (!BENEFIT_TYPES.has(b)) {
      return fail(
        "unknown_benefit_type",
        `benefit_type "${raw.benefit_type}" must be one of ${[...BENEFIT_TYPES].join(", ")}`,
      );
    }
    benefit_type = b;
  }

  // ---- nullable numeric fields (default null) ----
  const numFields: [keyof RawMilestoneRow, string][] = [
    ["spend_threshold_inr", "spend_threshold_inr"],
    ["tier_order", "tier_order"],
    ["benefit_value_inr", "benefit_value_inr"],
  ];
  const nums: Record<string, number | null> = {};
  for (const [field, label] of numFields) {
    const n = parseNum(raw[field], label);
    if (n && typeof n === "object") return fail("bad_number", n.error);
    nums[field] = n;
  }

  // ---- mutual_exclusivity_group (optional free text) ----
  const mutual_exclusivity_group = isBlank(raw.mutual_exclusivity_group)
    ? null
    : String(raw.mutual_exclusivity_group).trim();

  return {
    ok: true,
    milestone: {
      cardSlug: slug,
      milestone_type,
      milestone_period,
      spend_threshold_inr: nums.spend_threshold_inr,
      tier_order: nums.tier_order,
      mutual_exclusivity_group,
      benefit_type,
      benefit_value_inr: nums.benefit_value_inr,
      is_active: parseBool(raw.is_active),
    },
  };
}

// Deterministic milestone identity within a card: (card, milestone_type,
// spend_threshold_inr). Two uploads of the same combo produce the same key, so
// the upload UPSERTS by it — an existing milestone is replaced in place; a new
// combo is inserted; the card's other milestones are left untouched. null cells
// collapse to a stable sentinel so blank thresholds still key deterministically.
export function milestoneKeyFor(
  cardAdvisorKey: string,
  milestone_type: string | null,
  spend_threshold_inr: number | null,
): string {
  return `${cardAdvisorKey}__${milestone_type ?? "_notype"}__${spend_threshold_inr ?? "_nothreshold"}`;
}

// Build the CardMilestone document body from a normalized milestone.
export function milestoneToDoc(
  milestone: NormalizedMilestone,
  cardAdvisorKey: string,
  milestoneKey: string,
) {
  return {
    milestoneKey,
    cardAdvisorKey,
    milestone_type: milestone.milestone_type,
    milestone_period: milestone.milestone_period,
    spend_threshold_inr: milestone.spend_threshold_inr,
    tier_order: milestone.tier_order,
    mutual_exclusivity_group: milestone.mutual_exclusivity_group,
    benefit_type: milestone.benefit_type,
    benefit_value_inr: milestone.benefit_value_inr,
    is_active: milestone.is_active,
  };
}
