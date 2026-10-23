/** Shapes shared by the admin affiliate report routes and the admin tab. */

export type ReportRange = "7d" | "30d" | "90d";

export interface FunnelRow {
  key: string;
  label: string;
  clicks: number;
  /** Clicks that went out through a link that earns (Cuelinks or another network). */
  earningClicks: number;
  conversions: number;
  pending: number;
  confirmed: number;
  rejected: number;
  commissionConfirmed: number;
  commissionPending: number;
  /** conversions ÷ clicks, %; null without clicks. */
  cr: number | null;
  /** Confirmed commission ÷ clicks, ₹; null without clicks. */
  epc: number | null;
}

export interface DayPoint {
  date: string;
  clicks: number;
  conversions: number;
}

export type UnearnedReason =
  | "needs_access" // Cuelinks campaign exists; we must apply
  | "not_linked" // open campaign exists, but we route this somewhere it doesn't cover
  | "no_campaign" // nothing on Cuelinks for this domain
  | "no_destination"; // nothing on file; the click went back into the app

export interface UnearnedRow {
  type: "card" | "portal" | "voucher" | "offer";
  key: string;
  label: string;
  clicks: number;
  destinationHost: string | null;
  reason: UnearnedReason;
  campaign: { id: number; name: string; status: string } | null;
}

export interface AccessNeededRow {
  campaignId: number;
  campaignName: string;
  status: string;
  payout: string;
  payoutType: string;
  /** Our cards/merchants that would earn once approved. */
  usedBy: string[];
  /** Clicks in the range that didn't earn because of this campaign. */
  lostClicks: number;
}

export interface FunnelReport {
  range: ReportRange;
  from: string;
  to: string;
  totals: FunnelRow;
  byDay: DayPoint[];
  bySurface: FunnelRow[];
  byCard: FunnelRow[];
  byMerchant: FunnelRow[];
  byStep: { step: string; clicks: number }[];
  unearned: UnearnedRow[];
  accessNeeded: AccessNeededRow[];
}

export interface Reconciliation {
  ours: { transactions: number; commission: number };
  cuelinks: { transactions: number; commission: number };
  /** True when the gap exceeds the threshold (10% or 2 transactions, whichever is larger). */
  mismatch: boolean;
}

export interface CuelinksReport {
  performance: {
    totals: { clicks: number; transactions: number; commission: number; epc: number };
    byDay: { date: string; clicks: number; transactions: number; commission: number }[];
  } | null;
  campaigns: {
    campaignName: string;
    channelName: string;
    clicks: number;
    transactions: number;
    commission: number;
    epc: number;
  }[] | null;
  earnings: {
    month: string;
    pending: number;
    validated: number;
    payable: number;
    claimed: number;
    rejected: number;
  }[] | null;
  unmonetized: { domain: string; clicks: number; status: string }[] | null;
  reconciliation: Reconciliation | null;
  /** Sections that failed to load, so the UI can say so instead of showing zeros. */
  errors: string[];
}

// ---- link health (Phase 5) ----------------------------------------------------

export type HealthTypeName = "card" | "portal" | "voucher";

export interface HealthSummaryRow {
  type: HealthTypeName;
  total: number;
  earning: number;
  notEarning: number;
  broken: number;
  unchecked: number;
}

export interface HealthItem {
  key: string;
  type: HealthTypeName;
  label: string;
  step: string | null;
  affiliated: boolean;
  destinationHost: string | null;
  pageStatus: string | null;
  broken: boolean;
  /** Why it doesn't earn (or "page_not_found" when the page is gone). */
  reason: UnearnedReason | "page_not_found" | null;
  campaign: { id: number; name: string; status: string } | null;
  clicks30d: number;
  lastChange: string | null;
  lastChangeAt: string | null;
  checkedAt: string | null;
}

export interface HealthReport {
  summary: HealthSummaryRow[];
  /** Oldest check across all targets — every target has been checked since then. */
  allCheckedSince: string | null;
  changes: HealthItem[];
  problems: HealthItem[];
}
