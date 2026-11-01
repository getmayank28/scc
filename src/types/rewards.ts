/** Shapes shared by /api/rewards, /api/admin/campaign and their pages. */

export type RewardClaimStatus = "applied" | "approved" | "issued" | "rejected" | "duplicate_bank";

/** A claim as the user sees it. Never carries the voucher code. */
export interface RewardClaim {
  id: string;
  campaign: string;
  cardSlug: string;
  cardName: string;
  bank: string;
  amount: number;
  status: RewardClaimStatus;
  appliedAt: string;
  approvedAt: string | null;
  issuedAt: string | null;
  rejectedAt: string | null;
  voucher: {
    brand: string;
    amount: number;
    expiry: string | null;
    revealed: boolean;
    /** Whether a PIN comes with the code, so the page can lay its row out before reveal. */
    hasPin: boolean;
    /** When the user marked it used (self-reported), else null. */
    usedAt: string | null;
  } | null;
}

export interface RewardsResponse {
  claims: RewardClaim[];
  /** An issued voucher the user hasn't opened yet — drives the red dot. */
  hasUnrevealed: boolean;
}

export interface RevealedVoucher {
  brand: string;
  amount: number;
  code: string;
  pin: string | null;
  expiry: string | null;
}

// ---- admin ----

export type CampaignRange = "7d" | "30d" | "90d" | "all";

export interface AdminClaimRow {
  id: string;
  userId: string;
  phone: string | null;
  name: string | null;
  cardSlug: string;
  cardName: string;
  bank: string;
  amount: number;
  status: RewardClaimStatus;
  matchType: "subid" | "inferred";
  cuelinksId: number;
  appliedAt: string;
  approvedAt: string | null;
  issuedAt: string | null;
  revealedAt: string | null;
  /** Hours left on the 48h clock (negative = overdue); approved claims only. */
  hoursLeft: number | null;
  flags: string[];
}

export interface ReviewTxnRow {
  cuelinksId: number;
  status: string;
  campaignName: string | null;
  campaignId: number | null;
  cardSlug: string | null;
  surface: string | null;
  userId: string | null;
  phone: string | null;
  attribution: string;
  transactionDate: string | null;
}

export interface FunnelRow {
  key: string;
  label: string;
  applyClicks: number;
  applied: number;
  approved: number;
  issued: number;
  revealed: number;
  rejected: number;
}

export interface CampaignAdminReport {
  range: CampaignRange;
  funnel: FunnelRow[];
  queue: AdminClaimRow[];
  review: {
    flagged: AdminClaimRow[];
    hdfcNoSubid: ReviewTxnRow[];
    unmatched: ReviewTxnRow[];
    otherSurface: ReviewTxnRow[];
  };
  money: {
    liability: number;
    issued: number;
    revealed: number;
    writeOffs: number;
    commission: number;
  };
  health: {
    lastWebhookAt: string | null;
    webhookStale: boolean;
    lastSyncAt: string | null;
    voucherKeyConfigured: boolean;
    templatesConfigured: Record<string, boolean>;
  };
}

export interface ClaimTimelineEvent {
  at: string;
  label: string;
  detail?: string;
}

export interface AdminClaimDetail extends AdminClaimRow {
  timeline: ClaimTimelineEvent[];
}
