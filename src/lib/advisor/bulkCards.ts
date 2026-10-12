// Pure helpers for the admin "bulk cards upload" flow: normalise spreadsheet
// rows into CardDoc documents. Kept free of Mongo/IO so it can be unit-tested
// and reused by the API route. Mirrors bulkRules.ts.
//
// Category and every enum field are validated against the LIVE types (CATEGORIES
// from cards.ts, plus the RewardType / WelcomeBenefitType / LoungeProgram
// unions) so the upload always accepts exactly what the engine understands. A
// row whose cell falls outside the matching interface is REJECTED (reported in
// the failed-row report) and not written to the DB; the rest of the file still
// imports.
//
// Identity: `card_id` IS the slug (upsert key). Each row is upserted by slug —
// an existing card is overwritten in place, a new one inserted. Required
// columns: card_id, name. Everything else is optional and falls back to a
// sensible default.

import { CATEGORIES, type Category } from "@/lib/logic/advisor/cards";
import type {
  RewardType,
  WelcomeBenefitType,
  LoungeProgram,
  LoungeAccess,
} from "@/lib/logic/advisor/cards";

const CATEGORY_SET = new Set<string>(Object.values(CATEGORIES));

const REWARD_TYPES = new Set<RewardType>(["points", "cashback", "miles"]);
const WELCOME_TYPES = new Set<WelcomeBenefitType>([
  "points",
  "voucher",
  "cashback",
  "miles",
  "membership",
]);
const LOUNGE_PROGRAMS = new Set<LoungeProgram>([
  "issuer",
  "priority_pass",
  "dreamfolks",
  "loungekey",
]);
const LOUNGE_PERIODS = new Set<LoungeAccess["period"]>(["quarter", "year"]);

// "Travel - Cabs" -> "travel_cabs", "Offline_Food_Dining" -> "offline_food_dining"
export function normalizeKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

// ---- canonical columns -----------------------------------------------------
// Order here is the order columns appear in the downloadable template and the
// failed-row report. Uses dotted paths for nested fields, matching the source
// spreadsheet's headers exactly.
export const TEMPLATE_COLUMNS = [
  "card_id",
  "name",
  "product_type",
  "invitation_only",
  "issuer",
  "eligibility.min_salary_inr",
  "eligibility.min_self_employed_income_inr",
  "eligibility.min_age",
  "eligibility.max_age",
  "fees.joining_inr",
  "fees.joining_gst_inr",
  "fees.annual_inr",
  "fees.annual_gst_inr",
  "fees.waiver_spend_inr",
  "fees.joining_waiver_spend_inr",
  "fees.joining_fee_waiver_days",
  "fees.is_lifetime_free",
  "forex_markup_percentage",
  "rewards.base_reward_rate",
  "rewards.point_value_inr",
  "rewards.points_expiry_months",
  "rewards.reward_type",
  "categories",
  "excluded_categories",
  "welcome_benefit.type",
  "welcome_benefit.value_inr",
  "welcome_benefit.condition",
  "welcome_benefit.expires_in_months",
  "welcome_benefit.display",
  "lounge.domestic.visitsPerPeriod",
  "lounge.domestic.period",
  "lounge.domestic.annualCap",
  "lounge.domestic.spendCondition.thresholdInr",
  "lounge.domestic.spendCondition.windowMonths",
  "lounge.domestic.membershipRequired",
  "lounge.domestic.program",
  "lounge.domestic.display",
  "lounge.international.visitsPerPeriod",
  "lounge.international.period",
  "lounge.international.annualCap",
  "lounge.international.spendCondition.thresholdInr",
  "lounge.international.spendCondition.windowMonths",
  "lounge.international.membershipRequired",
  "lounge.international.program",
  "lounge.international.display",
  "ideal_for",
  "not_ideal_for",
  "miles_and_hotel_transfer_available",
  "miles_and_hotel_partners",
  "max_value_on_transfer",
  "is_active",
] as const;

export type ColumnName = (typeof TEMPLATE_COLUMNS)[number];

// Header aliases -> canonical column. Compared after normalizeKey() (so
// "eligibility.min_age" and "Eligibility - Min Age" both resolve). The exact
// column names map to themselves; a few synonyms are added.
const HEADER_ALIASES: Record<string, ColumnName> = {
  ...Object.fromEntries(
    TEMPLATE_COLUMNS.map((c) => [normalizeKey(c), c] as const),
  ),
  advisor_key: "card_id",
  advisorkey: "card_id",
  slug: "card_id",
};

export function mapHeader(rawHeader: string): ColumnName | null {
  return HEADER_ALIASES[normalizeKey(rawHeader)] ?? null;
}

// A raw row keyed by the canonical (dotted) column name.
type Cell = string | number | boolean | null | undefined;
export type RawCardRow = Partial<Record<ColumnName, Cell>>;

export interface NormalizedCard {
  name: string;
  slug: string;
  product_type: string;
  invitation_only: boolean;
  issuer: string[];
  eligibility: {
    min_salary_inr: number;
    min_self_employed_income_inr: number;
    min_age: number;
    max_age: number;
  };
  fees: {
    joining_inr: number;
    joining_gst_inr: number;
    annual_inr: number;
    annual_gst_inr: number;
    waiver_spend_inr: number;
    joining_waiver_spend_inr: number;
    joining_fee_waiver_days: number | null;
    is_lifetime_free: boolean;
  };
  forex_markup_percentage: number;
  rewards: {
    base_reward_rate: number;
    point_value_inr: number;
    points_expiry_months: number | null;
    reward_type: RewardType;
  };
  categories: Category[];
  excluded_categories: Category[];
  welcome_benefit: {
    type: WelcomeBenefitType;
    value_inr: number;
    condition: string;
    expires_in_months: number;
    display: string;
  } | null;
  lounge: {
    domestic: LoungeAccess | null;
    international: LoungeAccess | null;
  };
  ideal_for: string[];
  not_ideal_for: string[];
  miles_and_hotel_transfer_available: boolean;
  miles_and_hotel_partners: string[];
  max_value_on_transfer: string[];
  is_active: boolean;
}

export type DropCode =
  | "missing_card_id"
  | "missing_name"
  | "bad_number"
  | "unknown_category"
  | "unknown_reward_type"
  | "unknown_welcome_type"
  | "bad_lounge"
  | "duplicate";

export interface RowError {
  row: number; // 1-based, matching the spreadsheet (header = row 1)
  message: string;
  code: DropCode;
}

// ---- cell parsers ----------------------------------------------------------

const isBlank = (v: Cell): boolean =>
  v === undefined || v === null || String(v).trim() === "";

// A numeric cell. Blank -> null (caller decides the default). Non-numeric ->
// error. Negative allowed.
function parseNum(raw: Cell, label: string): number | null | { error: string } {
  if (isBlank(raw)) return null;
  const n = Number(String(raw).trim());
  if (!Number.isFinite(n)) return { error: `${label} "${raw}" is not a number` };
  return n;
}

// Boolean cell: true / 1 / yes / y -> true, false / 0 / no / n / blank -> false.
function parseBool(raw: Cell): boolean {
  if (isBlank(raw)) return false;
  const s = String(raw).trim().toLowerCase();
  return s === "true" || s === "1" || s === "yes" || s === "y";
}

// Split a list cell on | or , into trimmed, non-empty tokens. Blank -> [].
function parseList(raw: Cell): string[] {
  if (isBlank(raw)) return [];
  return String(raw)
    .split(/[|,]/)
    .map((x) => x.trim())
    .filter(Boolean);
}

// Split an ideal_for / not_ideal_for cell on "||" only. Each token is a full
// sentence that may itself contain commas and single pipes, so we must not
// split on those. Blank -> [].
function parseSentenceList(raw: Cell): string[] {
  if (isBlank(raw)) return [];
  return String(raw)
    .split("||")
    .map((x) => x.trim())
    .filter(Boolean);
}

// Split a list cell of categories, normalising and validating each against the
// live CATEGORIES. Returns the resolved categories or the first unknown token.
function parseCategoryList(
  raw: Cell,
  label: string,
): Category[] | { error: string } {
  const out: Category[] = [];
  for (const token of parseList(raw)) {
    const key = normalizeKey(token);
    if (!CATEGORY_SET.has(key)) {
      return { error: `${label}: unknown category "${token}" (normalized "${key}")` };
    }
    out.push(key as Category);
  }
  return out;
}

// Build one LoungeAccess side (domestic | international) from its columns. The
// side is created only when visitsPerPeriod is present; blank -> null. When
// present, period/program are validated; spendCondition is created only when
// its threshold is present.
function parseLounge(
  row: RawCardRow,
  prefix: "lounge.domestic" | "lounge.international",
): LoungeAccess | null | { error: string } {
  const g = (k: string) => row[`${prefix}.${k}` as ColumnName];

  const visits = parseNum(g("visitsPerPeriod"), `${prefix}.visitsPerPeriod`);
  if (visits && typeof visits === "object") return visits; // {error}
  if (visits === null) return null; // no lounge access on this side

  const periodRaw = String(g("period") ?? "").trim().toLowerCase();
  const period = (periodRaw || "year") as LoungeAccess["period"];
  if (!LOUNGE_PERIODS.has(period)) {
    return { error: `${prefix}.period "${periodRaw}" must be one of ${[...LOUNGE_PERIODS].join(", ")}` };
  }

  const annualCap = parseNum(g("annualCap"), `${prefix}.annualCap`);
  if (annualCap && typeof annualCap === "object") return annualCap;

  const programRaw = String(g("program") ?? "").trim().toLowerCase();
  const program = (programRaw || "issuer") as LoungeProgram;
  if (!LOUNGE_PROGRAMS.has(program)) {
    return { error: `${prefix}.program "${programRaw}" must be one of ${[...LOUNGE_PROGRAMS].join(", ")}` };
  }

  // spendCondition — created only when its threshold is present.
  const threshold = parseNum(
    g("spendCondition.thresholdInr"),
    `${prefix}.spendCondition.thresholdInr`,
  );
  if (threshold && typeof threshold === "object") return threshold;
  let spendCondition: LoungeAccess["spendCondition"] = null;
  if (threshold !== null) {
    const windowMonths = parseNum(
      g("spendCondition.windowMonths"),
      `${prefix}.spendCondition.windowMonths`,
    );
    if (windowMonths && typeof windowMonths === "object") return windowMonths;
    spendCondition = {
      thresholdInr: threshold,
      windowMonths: windowMonths ?? 0,
    };
  }

  const membershipRaw = String(g("membershipRequired") ?? "").trim();
  const membershipRequired = membershipRaw || null;

  return {
    visitsPerPeriod: visits,
    period,
    annualCap: annualCap ?? 0,
    spendCondition,
    membershipRequired,
    program,
    display: String(g("display") ?? "").trim(),
  };
}

// Validate + convert a single raw row. `rowNumber` is the 1-based sheet row
// (used only for error reporting). Returns either a normalized card or an error.
export function normalizeCardRow(
  raw: RawCardRow,
  rowNumber: number,
): { ok: true; card: NormalizedCard } | { ok: false; error: RowError } {
  const fail = (code: DropCode, message: string) =>
    ({ ok: false as const, error: { row: rowNumber, message, code } });

  // ---- required: card_id, name ----
  const cardId = String(raw.card_id ?? "").trim();
  if (!cardId) return fail("missing_card_id", "Missing card_id");
  const name = String(raw.name ?? "").trim();
  if (!name) return fail("missing_name", "Missing name");

  // ---- numeric fields (default 0 unless nullable) ----
  // Collected via a helper so a single bad cell rejects the row with its label.
  const numErr = (label: string, v: Cell): number | { error: string } => {
    const n = parseNum(v, label);
    if (n && typeof n === "object") return n;
    return n ?? 0;
  };
  const nullableNum = (label: string, v: Cell): number | null | { error: string } => {
    const n = parseNum(v, label);
    return n; // {error} | number | null
  };

  const numeric: Record<string, number> = {};
  const numCols: ColumnName[] = [
    "eligibility.min_salary_inr",
    "eligibility.min_self_employed_income_inr",
    "eligibility.min_age",
    "eligibility.max_age",
    "fees.joining_inr",
    "fees.joining_gst_inr",
    "fees.annual_inr",
    "fees.annual_gst_inr",
    "fees.waiver_spend_inr",
    "fees.joining_waiver_spend_inr",
    "forex_markup_percentage",
    "rewards.base_reward_rate",
    "rewards.point_value_inr",
    "welcome_benefit.value_inr",
    "welcome_benefit.expires_in_months",
  ];
  for (const col of numCols) {
    const r = numErr(col, raw[col]);
    if (typeof r === "object") return fail("bad_number", r.error);
    numeric[col] = r;
  }

  // Nullable numerics.
  const joiningWaiverDays = nullableNum(
    "fees.joining_fee_waiver_days",
    raw["fees.joining_fee_waiver_days"],
  );
  if (joiningWaiverDays && typeof joiningWaiverDays === "object") {
    return fail("bad_number", joiningWaiverDays.error);
  }
  const pointsExpiry = nullableNum(
    "rewards.points_expiry_months",
    raw["rewards.points_expiry_months"],
  );
  if (pointsExpiry && typeof pointsExpiry === "object") {
    return fail("bad_number", pointsExpiry.error);
  }

  // ---- reward_type (default "points") ----
  const rewardTypeRaw = String(raw["rewards.reward_type"] ?? "").trim().toLowerCase();
  const reward_type = (rewardTypeRaw || "points") as RewardType;
  if (!REWARD_TYPES.has(reward_type)) {
    return fail(
      "unknown_reward_type",
      `rewards.reward_type "${rewardTypeRaw}" must be one of ${[...REWARD_TYPES].join(", ")}`,
    );
  }

  // ---- categories / excluded_categories ----
  const categories = parseCategoryList(raw.categories, "categories");
  if ("error" in categories) return fail("unknown_category", categories.error);
  const excluded = parseCategoryList(raw.excluded_categories, "excluded_categories");
  if ("error" in excluded) return fail("unknown_category", excluded.error);

  // ---- welcome_benefit — created only when its type is present ----
  let welcome_benefit: NormalizedCard["welcome_benefit"] = null;
  const wbTypeRaw = String(raw["welcome_benefit.type"] ?? "").trim().toLowerCase();
  if (wbTypeRaw) {
    if (!WELCOME_TYPES.has(wbTypeRaw as WelcomeBenefitType)) {
      return fail(
        "unknown_welcome_type",
        `welcome_benefit.type "${wbTypeRaw}" must be one of ${[...WELCOME_TYPES].join(", ")}`,
      );
    }
    welcome_benefit = {
      type: wbTypeRaw as WelcomeBenefitType,
      value_inr: numeric["welcome_benefit.value_inr"],
      condition: String(raw["welcome_benefit.condition"] ?? "").trim(),
      expires_in_months: numeric["welcome_benefit.expires_in_months"],
      display: String(raw["welcome_benefit.display"] ?? "").trim(),
    };
  }

  // ---- lounge (domestic + international) ----
  const domestic = parseLounge(raw, "lounge.domestic");
  if (domestic && typeof domestic === "object" && "error" in domestic) {
    return fail("bad_lounge", domestic.error);
  }
  const international = parseLounge(raw, "lounge.international");
  if (international && typeof international === "object" && "error" in international) {
    return fail("bad_lounge", international.error);
  }

  return {
    ok: true,
    card: {
      slug: cardId, // card_id IS the slug
      name,
      product_type: String(raw.product_type ?? "").trim() || "cc",
      invitation_only: parseBool(raw.invitation_only),
      issuer: parseList(raw.issuer),
      eligibility: {
        min_salary_inr: numeric["eligibility.min_salary_inr"],
        min_self_employed_income_inr:
          numeric["eligibility.min_self_employed_income_inr"],
        min_age: numeric["eligibility.min_age"],
        max_age: numeric["eligibility.max_age"],
      },
      fees: {
        joining_inr: numeric["fees.joining_inr"],
        joining_gst_inr: numeric["fees.joining_gst_inr"],
        annual_inr: numeric["fees.annual_inr"],
        annual_gst_inr: numeric["fees.annual_gst_inr"],
        waiver_spend_inr: numeric["fees.waiver_spend_inr"],
        joining_waiver_spend_inr: numeric["fees.joining_waiver_spend_inr"],
        joining_fee_waiver_days: joiningWaiverDays,
        is_lifetime_free: parseBool(raw["fees.is_lifetime_free"]),
      },
      forex_markup_percentage: numeric["forex_markup_percentage"],
      rewards: {
        base_reward_rate: numeric["rewards.base_reward_rate"],
        point_value_inr: numeric["rewards.point_value_inr"],
        points_expiry_months: pointsExpiry,
        reward_type,
      },
      categories: categories as Category[],
      excluded_categories: excluded as Category[],
      welcome_benefit,
      lounge: {
        domestic: (domestic as LoungeAccess | null) ?? null,
        international: (international as LoungeAccess | null) ?? null,
      },
      ideal_for: parseSentenceList(raw.ideal_for),
      not_ideal_for: parseSentenceList(raw.not_ideal_for),
      miles_and_hotel_transfer_available: parseBool(
        raw.miles_and_hotel_transfer_available,
      ),
      miles_and_hotel_partners: parseList(raw.miles_and_hotel_partners),
      max_value_on_transfer: parseList(raw.max_value_on_transfer),
      // Default is_active to true when the cell is blank so a minimal sheet
      // produces live cards; an explicit false/0/no disables the card.
      is_active: isBlank(raw.is_active) ? true : parseBool(raw.is_active),
    },
  };
}

// Build the CardDoc document body from a normalized card. slug is the upsert
// key and IS part of the $set (it also lives in the filter). bankName is
// not a dedicated sheet column — fall back to the first issuer when present so
// downstream (giftors/redirect) has something to key on; bankId is optional and
// left unset (defaults to null).
export function cardToDoc(card: NormalizedCard) {
  return {
    name: card.name,
    slug: card.slug,
    bankName: card.issuer[0] ?? "",
    product_type: card.product_type,
    invitation_only: card.invitation_only,
    issuer: card.issuer,
    eligibility: card.eligibility,
    fees: card.fees,
    forex_markup_percentage: card.forex_markup_percentage,
    rewards: card.rewards,
    categories: card.categories,
    excluded_categories: card.excluded_categories,
    welcome_benefit: card.welcome_benefit,
    lounge: card.lounge,
    ideal_for: card.ideal_for,
    not_ideal_for: card.not_ideal_for,
    miles_and_hotel_transfer_available: card.miles_and_hotel_transfer_available,
    miles_and_hotel_partners: card.miles_and_hotel_partners,
    max_value_on_transfer: card.max_value_on_transfer,
    is_active: card.is_active,
  };
}
