// ─────────────────────────────────────────────────────────────────────────────
// SIMULATED SPEND LEDGER + BENEFIT ENTITLEMENTS
//
// This is the ONLY fabricated data in the insights feature. Everything else —
// milestone thresholds, reward caps, annual fees and waiver spends — is read
// live from the `fisense-staging` card catalogue.
//
// Two things are mocked here, for two different reasons:
//
//   1. `LEDGER` — what the user spent, per card, per category. We cannot
//      observe this until email/statement access lands. Shaped exactly as a
//      statement parser would emit it.
//
//   2. `MOCK_ENTITLEMENTS` — lounge visits, movie tickets and golf rounds.
//      None of the three demo cards carry `lounge` data in staging (all null),
//      and there are no movie/golf fields in the schema at all. A statement or
//      benefits portal is precisely where these would come from, so this
//      block stands in for that feed.
//
// WHEN EMAIL ACCESS LANDS: delete this file. Point `getLedger()` at the
// statement parser and `getEntitlements()` at the benefits feed. No tracker,
// route or component needs to change — the types already match.
//
// Amounts are tuned so each card sits in a distinct narrative state at
// `demoNow()` (2026-03-05). Those states are asserted by `verifyLedger()`, so
// an accidental edit fails loudly instead of quietly flattening the demo.
// ─────────────────────────────────────────────────────────────────────────────

import type { Category } from "@/lib/logic/advisor/cards";
import type { LedgerEntry, WalletCard, BenefitEntitlement } from "./types";
import { demoNow, quarterWindow, monthWindow } from "./demoClock";

export const DEMO_SLUGS = {
  amexGold: "american-express-gold-card-american-express",
  millennia: "millennia-credit-card-hdfc-bank",
  cashbackSbi: "cashback-sbi-card-sbi-card",
} as const;

/**
 * The demo wallet.
 *
 * NOTE: Amex Gold is `is_active: false` in staging (delisted product). A real
 * user holding a delisted card still needs it tracked, so the wallet loader
 * fetches by slug regardless of `is_active` — see `loadWalletCards`.
 *
 * Anniversaries are the fee-waiver / annual-milestone reset dates, which a
 * statement reveals. Chosen so Millennia's waiver year closes 26 days after
 * `demoNow()` and SBI's 57 days after — two races at different distances.
 */
export const DEMO_WALLET: WalletCard[] = [
  {
    cardSlug: DEMO_SLUGS.amexGold,
    anniversary: new Date("2025-07-18T00:00:00.000Z"),
  },
  {
    cardSlug: DEMO_SLUGS.millennia,
    anniversary: new Date("2025-03-31T00:00:00.000Z"),
  },
  {
    cardSlug: DEMO_SLUGS.cashbackSbi,
    anniversary: new Date("2025-05-01T00:00:00.000Z"),
  },
];

const D = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

interface Spread {
  cardSlug: string;
  category: Category;
  merchant: string | null;
  totalInr: number;
  dates: string[];
}

/** Spread a total evenly across dates, remainder on the last. */
function spread(s: Spread): LedgerEntry[] {
  const per = Math.floor(s.totalInr / s.dates.length);
  return s.dates.map((iso, i) => ({
    cardSlug: s.cardSlug,
    category: s.category,
    merchant: s.merchant,
    amountInr:
      i === s.dates.length - 1 ? s.totalInr - per * (s.dates.length - 1) : per,
    postedAt: D(iso),
  }));
}

// ── Cashback SBI ────────────────────────────────────────────────────────────
// Reward cap: ₹2,000/month cashback, scope "card". At 5% on groceries/
// electronics/flights, the cap binds at just ₹40,000 of accelerated spend.
// March spend to date: ₹37,200 → ₹1,860 earned = 93% of the cap, on the 5th.
// This is the "stop — you are about to earn nothing" beat.
//
// Waiver year 01-May-2025 → 01-May-2026, threshold ₹2,00,000.
// Booked: ₹1,71,000 → ₹29,000 short, 57 days left. Fee ₹1,178.82.
const SBI: LedgerEntry[] = [
  ...spread({
    cardSlug: DEMO_SLUGS.cashbackSbi,
    category: "groceries_supermarkets",
    merchant: null,
    totalInr: 22200,
    dates: ["2026-03-01", "2026-03-03", "2026-03-04"],
  }),
  ...spread({
    cardSlug: DEMO_SLUGS.cashbackSbi,
    category: "electronics",
    merchant: null,
    totalInr: 15000,
    dates: ["2026-03-02"],
  }),
  ...spread({
    cardSlug: DEMO_SLUGS.cashbackSbi,
    category: "groceries_supermarkets",
    merchant: null,
    totalInr: 68000,
    dates: [
      "2025-05-19", "2025-07-08", "2025-08-23", "2025-10-14",
      "2025-11-26", "2026-01-18",
    ],
  }),
  ...spread({
    cardSlug: DEMO_SLUGS.cashbackSbi,
    category: "online_shopping",
    merchant: null,
    totalInr: 41000,
    dates: ["2025-06-11", "2025-09-17", "2025-12-21", "2026-02-13"],
  }),
  ...spread({
    cardSlug: DEMO_SLUGS.cashbackSbi,
    category: "utility_bills",
    merchant: null,
    totalInr: 24800,
    dates: [
      "2025-06-05", "2025-08-05", "2025-10-05",
      "2025-12-05", "2026-02-05",
    ],
  }),
];

// ── HDFC Millennia ──────────────────────────────────────────────────────────
// Quarterly milestone: ₹1,00,000 → ₹1,000 cashback.
// Q1 (Jan–Mar) booked: ₹92,500 → ₹7,500 short with 26 days left.
//
// Waiver year 31-Mar-2025 → 31-Mar-2026, threshold ₹1,00,000.
// Booked: ₹97,300 → ₹2,700 short, 26 days left. Fee ₹1,180.
// Both the milestone and the waiver clear on the same push — the feed should
// surface that these two goals share one action.
const MILLENNIA: LedgerEntry[] = [
  ...spread({
    cardSlug: DEMO_SLUGS.millennia,
    category: "online_shopping",
    merchant: null,
    totalInr: 44500,
    dates: ["2026-01-16", "2026-02-04", "2026-02-21", "2026-03-02"],
  }),
  ...spread({
    cardSlug: DEMO_SLUGS.millennia,
    category: "offline_food_dining",
    merchant: null,
    totalInr: 28000,
    dates: ["2026-01-09", "2026-01-28", "2026-02-14", "2026-03-01"],
  }),
  ...spread({
    cardSlug: DEMO_SLUGS.millennia,
    category: "entertainment",
    merchant: null,
    totalInr: 20000,
    dates: ["2026-01-22", "2026-02-27"],
  }),
  // Pre-quarter spend, inside the same waiver year (Apr 2025 – Dec 2025).
  ...spread({
    cardSlug: DEMO_SLUGS.millennia,
    category: "online_shopping",
    merchant: null,
    totalInr: 4800,
    dates: ["2025-11-12", "2025-12-23"],
  }),
];

// ── Amex Gold ───────────────────────────────────────────────────────────────
// Monthly milestone: ₹6,000 → 1,000 MR points. Resets 12×/yr, so it is always
// live — the recurring-value beat. March booked: ₹4,100 → ₹1,900 short with
// 26 days left. No fee waiver on this card (waiver_spend_inr = 0), so its
// ₹5,310 fee is unavoidable — the feed should say so rather than inventing a
// waiver race.
const AMEX: LedgerEntry[] = [
  ...spread({
    cardSlug: DEMO_SLUGS.amexGold,
    category: "offline_food_dining",
    merchant: null,
    totalInr: 4100,
    dates: ["2026-03-02", "2026-03-04"],
  }),
  ...spread({
    cardSlug: DEMO_SLUGS.amexGold,
    category: "online_shopping",
    merchant: null,
    totalInr: 96000,
    dates: [
      "2025-08-14", "2025-09-22", "2025-10-19", "2025-11-24",
      "2025-12-16", "2026-01-20", "2026-02-17",
    ],
  }),
  ...spread({
    cardSlug: DEMO_SLUGS.amexGold,
    category: "utility_bills",
    merchant: null,
    totalInr: 33000,
    dates: [
      "2025-09-07", "2025-11-07", "2026-01-07", "2026-02-07",
    ],
  }),
];

const LEDGER: LedgerEntry[] = [...SBI, ...MILLENNIA, ...AMEX].sort(
  (a, b) => a.postedAt.getTime() - b.postedAt.getTime(),
);

// ── Benefit entitlements (fully mocked) ─────────────────────────────────────
// None of the three demo cards carry lounge data in staging, and the schema has
// no movie/golf fields at all. These stand in for a benefits feed.
//
// `expiresAt` is what creates urgency: unused units are forfeited at period
// end, they do not roll over. `unitValueInr` is the realistic market value of
// one unit, used to compute rupees at risk.
export const MOCK_ENTITLEMENTS: BenefitEntitlement[] = [
  {
    id: "amex-gold-lounge",
    cardSlug: DEMO_SLUGS.amexGold,
    label: "Domestic lounge visits",
    benefitType: "lounge",
    totalUnits: 8,
    usedUnits: 2,
    unitValueInr: 1200,
    periodLabel: "this membership year",
    expiresAt: D("2026-07-18"),
  },
  {
    id: "amex-gold-golf",
    cardSlug: DEMO_SLUGS.amexGold,
    label: "Complimentary golf rounds",
    benefitType: "golf",
    totalUnits: 4,
    usedUnits: 0,
    unitValueInr: 3500,
    periodLabel: "this membership year",
    expiresAt: D("2026-07-18"),
  },
  {
    id: "millennia-movie",
    cardSlug: DEMO_SLUGS.millennia,
    label: "BookMyShow movie tickets",
    benefitType: "movie",
    totalUnits: 4,
    usedUnits: 1,
    unitValueInr: 500,
    periodLabel: "this quarter",
    // Quarter end — 26 days out, the tightest benefit deadline in the feed.
    expiresAt: D("2026-03-31"),
  },
  {
    id: "sbi-lounge",
    cardSlug: DEMO_SLUGS.cashbackSbi,
    label: "Domestic lounge visits",
    benefitType: "lounge",
    totalUnits: 4,
    usedUnits: 3,
    unitValueInr: 1200,
    periodLabel: "this quarter",
    expiresAt: D("2026-03-31"),
  },
];

/**
 * The user's spend history.
 * Replace with the statement parser when email access lands.
 */
export function getLedger(): LedgerEntry[] {
  return LEDGER;
}

export function getWallet(): WalletCard[] {
  return DEMO_WALLET;
}

/**
 * Benefit entitlements and consumption.
 * Replace with the benefits feed when access lands.
 */
export function getEntitlements(): BenefitEntitlement[] {
  return MOCK_ENTITLEMENTS;
}

/** Sum ledger entries matching a predicate. */
export function sumWhere(
  entries: LedgerEntry[],
  pred: (e: LedgerEntry) => boolean,
): number {
  return entries.reduce((t, e) => (pred(e) ? t + e.amountInr : t), 0);
}

// ── Narrative guardrail ─────────────────────────────────────────────────────
/**
 * Assert the ledger still produces the intended demo states. Called by the
 * insights route in development so a stray edit surfaces immediately rather
 * than silently flattening the story on stage.
 */
export function verifyLedger(): string[] {
  const problems: string[] = [];
  const now = demoNow();
  const q = quarterWindow(now);
  const m = monthWindow(now);
  const l = getLedger();

  const check = (label: string, actual: number, expected: number, why: string) => {
    if (actual !== expected) {
      problems.push(`${label} is ₹${actual}, expected ₹${expected} — ${why}`);
    }
  };

  check(
    "SBI March spend",
    sumWhere(
      l,
      (e) =>
        e.cardSlug === DEMO_SLUGS.cashbackSbi &&
        e.postedAt >= m.start &&
        e.postedAt < m.end,
    ),
    37200,
    "93% of the ₹2,000 monthly cashback cap at 5%.",
  );

  check(
    "SBI waiver-year spend",
    sumWhere(
      l,
      (e) =>
        e.cardSlug === DEMO_SLUGS.cashbackSbi &&
        e.postedAt >= D("2025-05-01") &&
        e.postedAt < D("2026-05-01"),
    ),
    171000,
    "₹29,000 short of the ₹2L waiver.",
  );

  check(
    "Millennia quarter spend",
    sumWhere(
      l,
      (e) =>
        e.cardSlug === DEMO_SLUGS.millennia &&
        e.postedAt >= q.start &&
        e.postedAt < q.end,
    ),
    92500,
    "₹7,500 short of the ₹1L quarterly milestone.",
  );

  check(
    "Millennia waiver-year spend",
    sumWhere(
      l,
      (e) =>
        e.cardSlug === DEMO_SLUGS.millennia &&
        e.postedAt >= D("2025-03-31") &&
        e.postedAt < D("2026-03-31"),
    ),
    97300,
    "₹2,700 short of the ₹1L waiver.",
  );

  check(
    "Amex March spend",
    sumWhere(
      l,
      (e) =>
        e.cardSlug === DEMO_SLUGS.amexGold &&
        e.postedAt >= m.start &&
        e.postedAt < m.end,
    ),
    4100,
    "₹1,900 short of the ₹6,000 monthly MR bonus.",
  );

  return problems;
}
