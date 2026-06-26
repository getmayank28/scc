// Pure helpers for the admin "bulk rules upload" flow: normalise spreadsheet
// rows into CardRule documents. Kept free of Mongo/IO so it can be unit-tested
// and reused by the API route.
//
// Category, merchant and every enum field are validated against the LIVE types
// (CATEGORIES from cards.ts, MERCHANTS + the Cap*/DirectSwipe* enums from
// rules.ts) so the upload always accepts exactly what the engine understands —
// no stale hard-coded list to drift out of sync. A row whose cell falls outside
// the matching interface is REJECTED (reported in the failed-row report) and not
// written to the DB; the rest of the file still imports.
//
// Required columns: slug, category. Everything else is optional and falls back
// to a sensible default (percentages -> 0, nullable limits -> null,
// redemption_mode -> "both"). valid_from/valid_until/is_active are NOT taken
// from the sheet for now — they are hardcoded to today / null / true.

import { CATEGORIES, type Category } from "@/lib/logic/advisor/cards";
import {
  MERCHANTS,
  type CapMetric,
  type CapPeriod,
  type CapScope,
  type DirectSwipeSchedule,
  type DirectSwipeTier,
  type DirectSwipeTierMode,
  type Merchant,
  type SharedCapGroup,
  type SharedCapType,
  CARD_LEVEL_CAP,
  TOTAL_LEVEL_CAP,
} from "@/lib/logic/advisor/rules";

const CATEGORY_SET = new Set<string>(Object.values(CATEGORIES));
const MERCHANT_SET = new Set<string>(Object.values(MERCHANTS));

// Allowed enum members, mirrored from the rules.ts unions. Kept as Sets for O(1)
// membership; if a union gains a member, add it here too.
const CAP_PERIODS = new Set<CapPeriod>(["daily", "monthly", "quarterly", "annually"]);
const CAP_METRICS = new Set<CapMetric>(["points", "inr", "cashback"]);
const CAP_SCOPES = new Set<CapScope>(["merchant", "category", "card"]);
const TIER_MODES = new Set<DirectSwipeTierMode>(["marginal", "whole"]);
const REDEMPTION_MODES = new Set<RedemptionMode>(["online", "offline", "both"]);
const CAP_TYPES = new Set<SharedCapType>(["combined", "standalone"]);

type RedemptionMode = "online" | "offline" | "both";

// "Travel - Cabs" -> "travel_cabs", "Offline_Food_Dining" -> "offline_food_dining"
export function normalizeKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

// The canonical columns we read. Everything else in the sheet is ignored.
type Cell = string | number | boolean | null | undefined;
export interface RawRuleRow {
  slug?: Cell;
  category?: Cell;
  merchant?: Cell;
  direct_swipe_percentage?: Cell;
  voucher_discount_percentage?: Cell;
  voucher_reward_percentage?: Cell;
  convenience_fee_percentage?: Cell;
  voucher_monthly_purchase_limit_inr?: Cell;
  max_voucher_size_inr?: Cell;
  vouchers_per_booking?: Cell;
  voucher_validity_in_months?: Cell;
  fuel_surcharge_applicable?: Cell;
  max_fuel_transaction_limit?: Cell;
  redemption_mode?: Cell;
  gv_coins_percentage?: Cell;
  shared_cap_group?: Cell;
  reward_cap_period?: Cell;
  reward_cap_metric?: Cell;
  reward_cap_value?: Cell;
  reward_cap_scope?: Cell;
  direct_swipe_schedule_mode?: Cell;
  direct_swipe_schedule_period?: Cell;
  direct_swipe_schedule_value?: Cell;
  partner?: Cell;
}

export interface NormalizedRule {
  cardSlug: string;
  category: Category;
  merchant: Merchant | null;
  reward: {
    direct_swipe_percentage: number;
    direct_swipe_schedule: DirectSwipeSchedule | null;
    voucher_discount_percentage: number;
    voucher_reward_percentage: number;
    convenience_fee_percentage: number;
  };
  caps: {
    reward_cap: {
      period: CapPeriod;
      metric: CapMetric;
      value: number;
      scope: CapScope;
    } | null;
    voucher_monthly_purchase_limit_inr: number | null;
    max_voucher_size_inr: number | null;
    vouchers_per_booking: number | null;
  };
  shared_cap_group: SharedCapGroup | null;
  fuel_surcharge_applicable: number;
  max_fuel_transaction_limit: number;
  redemption_mode: RedemptionMode;
  voucher_validity_in_months: number | null;
  gv_coins_percentage: number;
  partner: string | null;
}

export type DropCode =
  | "missing_slug"
  | "missing_category"
  | "unknown_category"
  | "unknown_merchant"
  | "bad_number"
  | "bad_reward_cap"
  | "bad_direct_swipe_schedule"
  | "bad_shared_cap_group"
  | "unknown_redemption_mode"
  | "unknown_slug";

export interface RowError {
  row: number; // 1-based, matching the spreadsheet (header = row 1)
  message: string;
  code: DropCode;
}

// The canonical column list, surfaced in the UI / template / failed-row report.
// Order here is the order columns appear in the downloadable template.
export const TEMPLATE_COLUMNS = [
  "slug",
  "category",
  "merchant",
  "direct_swipe_percentage",
  "voucher_discount_percentage",
  "voucher_reward_percentage",
  "convenience_fee_percentage",
  "voucher_monthly_purchase_limit_inr",
  "max_voucher_size_inr",
  "vouchers_per_booking",
  "voucher_validity_in_months",
  "fuel_surcharge_applicable",
  "max_fuel_transaction_limit",
  "redemption_mode",
  "gv_coins_percentage",
  "shared_cap_group",
  "reward_cap_period",
  "reward_cap_metric",
  "reward_cap_value",
  "reward_cap_scope",
  "direct_swipe_schedule_mode",
  "direct_swipe_schedule_period",
  "direct_swipe_schedule_value",
  "partner",
] as const;

// Header aliases -> canonical field. Compared after normalizeKey(). The exact
// snake_case column names map to themselves; a few common synonyms are added.
const HEADER_ALIASES: Record<string, keyof RawRuleRow> = {
  ...Object.fromEntries(
    TEMPLATE_COLUMNS.map((c) => [c, c as keyof RawRuleRow]),
  ),
  card_slug: "slug",
  direct_swipe: "direct_swipe_percentage",
  rate: "direct_swipe_percentage",
  cap_group: "shared_cap_group",
  group: "shared_cap_group",
};

export function mapHeader(rawHeader: string): keyof RawRuleRow | null {
  return HEADER_ALIASES[normalizeKey(rawHeader)] ?? null;
}

// ---- cell parsers ----------------------------------------------------------

const isBlank = (v: Cell): boolean =>
  v === undefined || v === null || String(v).trim() === "";

// A numeric cell. Blank -> null (caller decides the default). Non-numeric ->
// error. Negative values are allowed (e.g. forex -4.13).
function parseNum(
  raw: Cell,
  label: string,
): number | null | { error: string } {
  if (isBlank(raw)) return null;
  const n = Number(String(raw).trim());
  if (!Number.isFinite(n)) return { error: `${label} "${raw}" is not a number` };
  return n;
}

const CAP_TYPE_NAMES = new Set<string>([...CAP_TYPES]);

// Parse the optional shared_cap_group cell into a single group (or null). The
// cell is one token "multiplier:scope:capType" — parts in any order, split on
// :, | or /. Each part is classified: "combined"/"standalone" -> capType,
// numeric -> multiplier, the literal "card" -> a card-level pool, the literal
// "total" -> a card-total pool (earns 0 once its cap is exhausted, not the base
// rate), otherwise a (validated) merchant OR category — both land in the
// `merchant` slot as an opaque pool key. capType defaults to "combined".
// Blank -> null.
//   ""                  -> null
//   "10:amazon:combined"  -> { multiplier: 10, merchant: "amazon", capType: "combined" }
//   "1:utilities:combined"-> { multiplier: 1, merchant: "utilities", capType: "combined" }
//   "10:card:combined"  -> { multiplier: 10, merchant: "card", capType: "combined" }
//   "1:total:combined"  -> { multiplier: 1, merchant: "total", capType: "combined" }
//   "5:standalone"      -> { multiplier: 5, merchant: null, capType: "standalone" }
function parseSharedCapGroup(
  raw: Cell,
): SharedCapGroup | null | { error: string } {
  const s = String(raw ?? "").trim();
  if (!s) return null;

  let multiplier: number | null = null;
  let merchant: SharedCapGroup["merchant"] = null;
  let capType: SharedCapType | null = null;
  for (const p of s.split(/[:|/]/).map((x) => x.trim()).filter(Boolean)) {
    if (p === "*") continue; // explicit wildcard
    const lower = p.toLowerCase();
    if (CAP_TYPE_NAMES.has(lower)) {
      capType = lower as SharedCapType;
      continue;
    }
    const n = Number(p);
    if (Number.isFinite(n)) {
      multiplier = n;
      continue;
    }
    const m = normalizeKey(p);
    if (m === CARD_LEVEL_CAP) {
      // Card-level pool: keep the sentinel, leave multiplier/capType as parsed.
      merchant = CARD_LEVEL_CAP;
      continue;
    }
    if (m === TOTAL_LEVEL_CAP) {
      // Card-total pool: pools like "card" but earns 0 once the cap is exhausted.
      merchant = TOTAL_LEVEL_CAP;
      continue;
    }
    if (!MERCHANT_SET.has(m) && !CATEGORY_SET.has(m)) {
      return { error: `shared_cap_group: unknown merchant or category "${p}"` };
    }
    merchant = m as SharedCapGroup["merchant"];
  }
  if (multiplier === null && merchant === null && capType === null) {
    return {
      error: `shared_cap_group "${s}" must contain a multiplier, merchant/category, and/or capType (e.g. "10:amazon:combined")`,
    };
  }
  return { multiplier, merchant, capType: capType ?? "combined" };
}

// Build the reward_cap from its four columns. VALUE DRIVES IT: if reward_cap_value
// is blank, reward_cap is null and the other three are ignored. When the value is
// present, period/metric/scope default to monthly/points/card if blank, but a
// non-blank value outside the enum rejects the row.
function parseRewardCap(
  valueRaw: Cell,
  periodRaw: Cell,
  metricRaw: Cell,
  scopeRaw: Cell,
): NormalizedRule["caps"]["reward_cap"] | { error: string } {
  const value = parseNum(valueRaw, "reward_cap_value");
  if (value && typeof value === "object") return value; // {error}
  if (value === null) return null; // blank value -> no cap

  const period = isBlank(periodRaw)
    ? "monthly"
    : (String(periodRaw).trim().toLowerCase() as CapPeriod);
  if (!CAP_PERIODS.has(period)) {
    return { error: `reward_cap_period "${periodRaw}" must be one of ${[...CAP_PERIODS].join(", ")}` };
  }
  const metric = isBlank(metricRaw)
    ? "points"
    : (String(metricRaw).trim().toLowerCase() as CapMetric);
  if (!CAP_METRICS.has(metric)) {
    return { error: `reward_cap_metric "${metricRaw}" must be one of ${[...CAP_METRICS].join(", ")}` };
  }
  const scope = isBlank(scopeRaw)
    ? "card"
    : (String(scopeRaw).trim().toLowerCase() as CapScope);
  if (!CAP_SCOPES.has(scope)) {
    return { error: `reward_cap_scope "${scopeRaw}" must be one of ${[...CAP_SCOPES].join(", ")}` };
  }
  return { period, metric, value, scope };
}

// Build the direct-swipe spend-tiered schedule. VALUE DRIVES IT: schedule is
// created only when direct_swipe_schedule_value is present. mode defaults to
// "marginal", period to "monthly"; a non-blank value outside the enum rejects the
// row. The value cell is comma-separated "rate:minSpend" pairs (e.g.
// "3:0,10:20000" => 3x up to 20k/period, 10x beyond); the lowest tier must
// start at 0.
function parseSchedule(
  modeRaw: Cell,
  periodRaw: Cell,
  valueRaw: Cell,
): DirectSwipeSchedule | null | { error: string } {
  if (isBlank(valueRaw)) return null;

  const mode = isBlank(modeRaw)
    ? "marginal"
    : (String(modeRaw).trim().toLowerCase() as DirectSwipeTierMode);
  if (!TIER_MODES.has(mode)) {
    return { error: `direct_swipe_schedule_mode "${modeRaw}" must be one of ${[...TIER_MODES].join(", ")}` };
  }
  const period = isBlank(periodRaw)
    ? "monthly"
    : (String(periodRaw).trim().toLowerCase() as CapPeriod);
  if (!CAP_PERIODS.has(period)) {
    return { error: `direct_swipe_schedule_period "${periodRaw}" must be one of ${[...CAP_PERIODS].join(", ")}` };
  }

  const tiers: DirectSwipeTier[] = [];
  for (const pair of String(valueRaw).split(/[,;]/).map((t) => t.trim()).filter(Boolean)) {
    const at = pair.indexOf(":");
    if (at < 0) {
      return { error: `direct_swipe_schedule_value tier "${pair}" must be "rate:minSpend" (e.g. 10:20000)` };
    }
    const rate = Number(pair.slice(0, at).trim());
    const min = Number(pair.slice(at + 1).trim());
    if (!Number.isFinite(rate)) {
      return { error: `direct_swipe_schedule_value tier "${pair}": rate is not a number` };
    }
    if (!Number.isFinite(min) || min < 0) {
      return { error: `direct_swipe_schedule_value tier "${pair}": min spend must be a non-negative number` };
    }
    tiers.push({ min_spend_per_period_inr: min, rate });
  }
  if (tiers.length === 0) {
    return { error: `direct_swipe_schedule_value "${valueRaw}" has no tiers` };
  }
  tiers.sort((a, b) => a.min_spend_per_period_inr - b.min_spend_per_period_inr);
  if (tiers[0].min_spend_per_period_inr !== 0) {
    return { error: `direct_swipe_schedule_value "${valueRaw}": lowest tier must start at 0 (e.g. 3:0,10:20000)` };
  }
  return { mode, period, tiers };
}

// Validate + convert a single raw row. `rowNumber` is the 1-based sheet row
// (used only for error reporting). Returns either a normalized rule or an error.
export function normalizeRow(
  raw: RawRuleRow,
  rowNumber: number,
): { ok: true; rule: NormalizedRule } | { ok: false; error: RowError } {
  const fail = (code: DropCode, message: string) =>
    ({ ok: false as const, error: { row: rowNumber, message, code } });

  // ---- required: slug, category ----
  const slug = String(raw.slug ?? "").trim();
  if (!slug) return fail("missing_slug", "Missing slug");

  const categoryRaw = String(raw.category ?? "").trim();
  if (!categoryRaw) return fail("missing_category", "Missing category");
  const category = normalizeKey(categoryRaw);
  if (!CATEGORY_SET.has(category)) {
    return fail(
      "unknown_category",
      `Unknown category "${categoryRaw}" (normalized "${category}")`,
    );
  }

  // ---- merchant (optional) ----
  let merchant: Merchant | null = null;
  const merchantRaw = String(raw.merchant ?? "").trim();
  if (merchantRaw) {
    const m = normalizeKey(merchantRaw);
    if (!MERCHANT_SET.has(m)) {
      return fail(
        "unknown_merchant",
        `Unknown merchant "${merchantRaw}" (normalized "${m}"). Use a merchant key from MERCHANTS, or leave blank for a base/category rule.`,
      );
    }
    merchant = m as Merchant;
  }

  // ---- numeric reward / fee fields (default 0) ----
  const numFields: [keyof RawRuleRow, string][] = [
    ["direct_swipe_percentage", "direct_swipe_percentage"],
    ["voucher_discount_percentage", "voucher_discount_percentage"],
    ["voucher_reward_percentage", "voucher_reward_percentage"],
    ["convenience_fee_percentage", "convenience_fee_percentage"],
    ["fuel_surcharge_applicable", "fuel_surcharge_applicable"],
    ["max_fuel_transaction_limit", "max_fuel_transaction_limit"],
    ["gv_coins_percentage", "gv_coins_percentage"],
  ];
  const nums: Record<string, number> = {};
  for (const [field, label] of numFields) {
    const n = parseNum(raw[field], label);
    if (n && typeof n === "object") return fail("bad_number", n.error);
    nums[field] = n ?? 0;
  }

  // ---- nullable numeric limits (default null) ----
  const nullableFields: [keyof RawRuleRow, string][] = [
    ["voucher_monthly_purchase_limit_inr", "voucher_monthly_purchase_limit_inr"],
    ["max_voucher_size_inr", "max_voucher_size_inr"],
    ["vouchers_per_booking", "vouchers_per_booking"],
    ["voucher_validity_in_months", "voucher_validity_in_months"],
  ];
  const nullables: Record<string, number | null> = {};
  for (const [field, label] of nullableFields) {
    const n = parseNum(raw[field], label);
    if (n && typeof n === "object") return fail("bad_number", n.error);
    nullables[field] = n;
  }

  // ---- redemption_mode (default "both") ----
  let redemption_mode: RedemptionMode = "both";
  if (!isBlank(raw.redemption_mode)) {
    const r = String(raw.redemption_mode).trim().toLowerCase() as RedemptionMode;
    if (!REDEMPTION_MODES.has(r)) {
      return fail(
        "unknown_redemption_mode",
        `redemption_mode "${raw.redemption_mode}" must be one of ${[...REDEMPTION_MODES].join(", ")}`,
      );
    }
    redemption_mode = r;
  }

  // ---- direct-swipe schedule ----
  const schedule = parseSchedule(
    raw.direct_swipe_schedule_mode,
    raw.direct_swipe_schedule_period,
    raw.direct_swipe_schedule_value,
  );
  if (schedule && "error" in schedule) {
    return fail("bad_direct_swipe_schedule", schedule.error);
  }

  // ---- reward_cap ----
  const reward_cap = parseRewardCap(
    raw.reward_cap_value,
    raw.reward_cap_period,
    raw.reward_cap_metric,
    raw.reward_cap_scope,
  );
  if (reward_cap && "error" in reward_cap) {
    return fail("bad_reward_cap", reward_cap.error);
  }

  // ---- shared_cap_group ----
  const scg = parseSharedCapGroup(raw.shared_cap_group);
  if (scg && "error" in scg) return fail("bad_shared_cap_group", scg.error);

  // ---- partner (optional free-form text, default null) ----
  const partner = isBlank(raw.partner) ? null : String(raw.partner).trim();

  return {
    ok: true,
    rule: {
      cardSlug: slug,
      category: category as Category,
      merchant,
      reward: {
        direct_swipe_percentage: nums.direct_swipe_percentage,
        direct_swipe_schedule: schedule,
        voucher_discount_percentage: nums.voucher_discount_percentage,
        voucher_reward_percentage: nums.voucher_reward_percentage,
        convenience_fee_percentage: nums.convenience_fee_percentage,
      },
      caps: {
        reward_cap,
        voucher_monthly_purchase_limit_inr:
          nullables.voucher_monthly_purchase_limit_inr,
        max_voucher_size_inr: nullables.max_voucher_size_inr,
        vouchers_per_booking: nullables.vouchers_per_booking,
      },
      shared_cap_group: scg,
      fuel_surcharge_applicable: nums.fuel_surcharge_applicable,
      max_fuel_transaction_limit: nums.max_fuel_transaction_limit,
      redemption_mode,
      voucher_validity_in_months: nullables.voucher_validity_in_months,
      gv_coins_percentage: nums.gv_coins_percentage,
      partner,
    },
  };
}

// Deterministic rule identity within a card: (card, category, merchant,
// partner). Two uploads of the same combo produce the same key, so the upload
// UPSERTS by it — an existing rule is replaced in place; a new combo is
// inserted; the card's other rules are left untouched.
export function ruleKeyFor(
  cardAdvisorKey: string,
  category: Category,
  merchant: Merchant | null,
  partner: string | null,
): string {
  return `${cardAdvisorKey}__${category}__${merchant ?? "_base"}__${partner ?? "_nopartner"}`;
}

// Build the CardRule document body from a normalized rule. valid_from defaults to
// today; valid_until is null and is_active true (not uploadable yet).
export function ruleToDoc(
  rule: NormalizedRule,
  cardAdvisorKey: string,
  ruleKey: string,
) {
  return {
    ruleKey,
    cardAdvisorKey,
    category: rule.category,
    merchant: rule.merchant,
    reward: {
      direct_swipe_percentage: rule.reward.direct_swipe_percentage,
      direct_swipe_schedule: rule.reward.direct_swipe_schedule,
      voucher_discount_percentage: rule.reward.voucher_discount_percentage,
      voucher_reward_percentage: rule.reward.voucher_reward_percentage,
      convenience_fee_percentage: rule.reward.convenience_fee_percentage,
    },
    caps: {
      reward_cap: rule.caps.reward_cap,
      voucher_monthly_purchase_limit_inr:
        rule.caps.voucher_monthly_purchase_limit_inr,
      max_voucher_size_inr: rule.caps.max_voucher_size_inr,
      vouchers_per_booking: rule.caps.vouchers_per_booking,
    },
    shared_cap_group: rule.shared_cap_group,
    fuel_surcharge_applicable: rule.fuel_surcharge_applicable,
    max_fuel_transaction_limit: rule.max_fuel_transaction_limit,
    redemption_mode: rule.redemption_mode,
    voucher_validity_in_months: rule.voucher_validity_in_months,
    gv_coins_percentage: rule.gv_coins_percentage,
    partner: rule.partner,
    valid_from: new Date(),
    valid_until: null,
    is_active: true,
  };
}
