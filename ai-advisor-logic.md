# AI Card Advisor — recommendation logic, end to end

This document explains how the advisor turns a user's spend profile into a ranked
top-3 list of credit cards. Read it before touching any of the `recommend*`
engines or the scoring pipeline.

The advisor has **four independent engines** — travel, all-rounder, food,
shopping — each with a **phase 1** (fewer inputs, model-estimated spend) and a
**phase 2** (declared spend) variant. They differ only in how they model spend
and reward return; they all share the same final scoring pipeline described in
[§3](#3-the-shared-scoring-pipeline).

---

## 0. The one-line formula

For every card that survives filtering:

```
finalReturnInr = spendReturnInr        (Step 2 — engine-specific)
               + milestoneReturnInr    (Step 4 — shared)
               − feeInr                (Step 3 — shared)
```

Cards are sorted by `finalReturnInr` descending, and the **top 3** are returned.

---

## 1. Request flow (who calls what)

```
/demo page (client)  ──fetchRecommend("<endpoint>", body)──►  /api/recommend/<endpoint>/route.ts
                                                                      │
                                                          AdvisorCache.ensureFresh()
                                                                      │
                                                          recommend<X>(input, cards, bestOf, [rules], options)
                                                                      │
                                                          ┌──────────┴──────────┐
                                                   Step 1 filter          Step 2 spend return
                                                   Step 3 fee             Step 4 milestones
                                                          └──────────┬──────────┘
                                                             sort by finalReturnInr → top 3
```

- **Client**: `src/app/demo/page.tsx` — 8 form components, one per engine/phase.
  Each collects its own spend inputs plus the shared employment/income dropdowns
  (`src/app/demo/ProfileFields.tsx`) and POSTs via
  `fetchRecommend` (`src/lib/advisor/client.ts`).
- **Endpoints**: 8 per-engine routes under `src/app/api/recommend/**/route.ts`,
  plus a 9th chat-dispatch route `src/app/api/recommend/route.ts`.
- **Data**: `AdvisorCache` (`src/lib/advisor/cache.ts`) — process-local, 60s TTL,
  stale-while-revalidate. Hydrates active Cards, active CardRules, all CardBestOf
  payloads, and active CardMilestones from MongoDB (the `fisense-staging` DB).
- **Engines**: `src/lib/logic/advisor/{engine,allrounderEngine,foodCardEngine,shoppingCardEngine}.ts`.
- **Shared scoring**: `src/lib/logic/advisor/scoring.ts` (all of Steps 1, 3, 4).

### Endpoint → engine map

| Endpoint | Engine function |
|---|---|
| `travel/phase1` | `recommendTravelCard` |
| `travel` | `recommendTravelCardAdvanced` |
| `allrounder/phase1` | `recommendAllRounderCardPhaseOne` |
| `allrounder` | `recommendAllRounderCardPhaseTwo` |
| `food/phase1` | `recommendFoodCardPhaseOne` |
| `food` | `recommendFoodCardPhaseTwo` |
| `shopping/phase1` | `recommendShoppingCardPhaseOne` |
| `shopping` | `recommendShoppingCardPhaseTwo` |
| `recommend` (chat) | phase-2 engines, dispatched by category |

Every engine function takes an optional trailing `options?: EngineScoringOptions`:

```ts
interface EngineScoringOptions {
  profile?: UserProfile;                            // employmentType + salaryRange
  milestonesBySlug?: Map<string, MockMilestone[]>;  // keyed by card slug
}
```

Both are optional so the engines stay callable from scripts/tests without a DB.
When `profile` is absent the income filter is skipped; when `milestonesBySlug` is
absent milestone return is 0. **Fees are always deducted.**

---

## 2. Data model quick reference

The engines operate on `MockCard` (plain objects mapped from Mongo in
`AdvisorCache.toMockCard`). Key fields for scoring:

- `_id` — **equal to the card `slug`** (`toMockCard` sets `_id = doc.slug`). This
  is why milestones (keyed by `cardSlug`) join directly on `card._id`.
- `is_active`, `invitation_only` — filtering.
- `eligibility.min_salary_inr`, `eligibility.min_self_employed_income_inr` — income
  filtering (annual INR).
- `fees.{annual_inr, annual_gst_inr, waiver_spend_inr, is_lifetime_free}` — fee step.

Milestones are `MockMilestone` (mirror of `CardMilestoneDoc`), grouped per card:

- `milestone_period` — `one_time | daily | monthly | quarterly | halfyearly | annually`
- `spend_threshold_inr`, `benefit_value_inr`
- `mutual_exclusivity_group`, `tier_order` — for tiered milestones (see [§3.4](#34-step-4--milestone-benefits-threshold-checked)).

---

## 3. The shared scoring pipeline

All four engines call the same three helpers from `scoring.ts`. The convenience
wrapper `finalizeCardScore(card, spendReturnInr, annualSpendInr, milestones)`
runs Steps 3 + 4 and returns a `CardScoreBreakdown` that the engine spreads onto
each result row:

```ts
interface CardScoreBreakdown {
  annualSpendInr: number;
  feeInr: number;
  feeWaived: boolean;
  milestoneReturnInr: number;
  achievedMilestones: AchievedMilestone[];
  finalReturnInr: number;   // spendReturnInr + milestoneReturnInr − feeInr
}
```

### 3.1 Step 1 — Filter eligible cards

`filterEligibleCards(cards, profile)` keeps a card only if **all** hold:

1. `card.is_active === true`
2. `card.invitation_only` is falsy
3. Income eligibility passes (`isCardEligible`)

**Income eligibility.** `annualIncomeInrForProfile(profile)` estimates the user's
annual income from the bracket **midpoint** (average of the range):

- `employmentType` absent → returns `null` → **income filter skipped entirely**.
- `student_unemployed` → 0 (salaryRange ignored).
- `self_employed` → the bracket is already annual; use the annual midpoint.
- `salaried` / `retired` → the bracket is **monthly** take-home; use the monthly
  midpoint **× 12**.

Midpoint tables (open-bottom brackets average from 0):

| Salaried / Retired bracket | monthly midpoint | → annual (×12) |
|---|---|---|
| below_30k | 15,000 | 180,000 |
| 30k_to_50k | 40,000 | 480,000 |
| 50k_to_1l | 75,000 | 900,000 |
| 1l_to_2l (retired) | 150,000 | 1,800,000 |
| 1l_to_2_5l | 175,000 | 2,100,000 |
| 2_5l_to_5l | 375,000 | 4,500,000 |

| Self-employed bracket | annual midpoint |
|---|---|
| below_5l | 250,000 |
| 5l_to_10l | 750,000 |
| 10l_to_20l | 1,500,000 |
| 20l_to_50l | 3,500,000 |
| 50l_to_1cr | 7,500,000 |

Then compare: self-employed users are checked against
`eligibility.min_self_employed_income_inr`; everyone else against
`eligibility.min_salary_inr`. A missing/zero minimum → card passes. The card
passes iff `estimatedIncome >= minIncome`.

> Why midpoint, not lower bound: using the average of the bracket is more
> representative of the typical applicant than a conservative floor. This was an
> explicit product decision.

### 3.2 Step 2 — Spend return (engine-specific)

This is the pre-existing per-engine reward computation — unchanged by the scoring
work. Each engine models the user's annual spend, splits it into categories, and
looks up the best reward route (voucher / direct swipe / base rate) per category
from the precomputed `CardBestOf` payloads, respecting reward caps. The number it
produces is fed into `finalizeCardScore` as `spendReturnInr`:

| Engine | `spendReturnInr` | `annualSpendInr` |
|---|---|---|
| Travel | `netReturnInr` (gross rewards − forex cost) | domestic + international (+ extra flights) segment spend |
| All-rounder | `annualReturnInr` | `annualTotal` (monthly total × 12) |
| Food | `annualReturnInr` | delivery + dining annual spend |
| Shopping | `annualReturnInr` | online + offline (+ utility, phase 2) annual spend |

Travel specifics worth knowing (see `travel.ts`): spend = `tripsPerYear ×
avgSpendPerTrip`, split domestic/international by `MIX_SPLIT` (e.g.
`mostly_domestic` = 70/30), then per-segment into flights/hotels/other
(domestic 35/45/20, international 45/35/20). Forex cost = international-applicable
spend × card markup × 1.18 (18% GST). The advanced (phase 2) travel engine also
applies priority filters (low-forex, lounge access) **before** scoring.

### 3.3 Step 3 — Fee (waiver-aware)

`computeAnnualFeeInr(card, annualSpendInr)` → `{ feeInr, feeWaived }`:

1. No `fees` object → `{ 0, false }`.
2. `is_lifetime_free` → `{ 0, true }`.
3. `annualFee = annual_inr + annual_gst_inr`. If `annualFee <= 0` → `{ 0, false }`.
4. `waiver_spend_inr > 0` **and** `annualSpendInr >= waiver_spend_inr` → `{ 0, true }`.
5. Otherwise → `{ annualFee, false }`.

`annualSpendInr` is the engine's projected annual spend (the same number passed
to `finalizeCardScore`). So a big spender clears the waiver threshold and pays
nothing; a small spender pays the full renewal fee + GST.

### 3.4 Step 4 — Milestone benefits (threshold-checked)

`computeMilestoneReturnInr(milestones, annualSpendInr)` →
`{ milestoneReturnInr, achievedMilestones }`.

Occurrences per year by period: `daily 365, monthly 12, quarterly 4, halfyearly
2, annually 1`.

For each milestone:

1. **Skip** if period is null or `one_time` (joining perks aren't recurring
   spend rewards), or if `spend_threshold_inr`/`benefit_value_inr` is null/≤0.
2. `periodSpend = annualSpendInr / occurrencesPerYear`.
3. **Achieved** iff `periodSpend >= spend_threshold_inr`.
4. Achieved value = `benefit_value_inr × occurrencesPerYear` (the benefit repeats
   every period).

**Mutual exclusivity.** Milestones sharing a non-null `mutual_exclusivity_group`
are alternative tiers of the same benefit — only **one** is credited. Among the
*achieved* members of a group we keep the one with the **highest priority = lowest
`tier_order` number** (tier_order 1 beats 2). A null `tier_order` ranks last
(`+Infinity`); ties break toward the higher annual value.

The final `milestoneReturnInr` is the sum of every ungrouped achieved milestone
plus one winner per group.

> **Data caveat**: milestones **without** a `mutual_exclusivity_group` *stack*.
> If a card has several annual voucher rows at different thresholds that should be
> mutually exclusive, set the same group on them in the data — the engine won't
> infer it.

### 3.5 Assemble + rank

Each engine spreads the `CardScoreBreakdown` onto its per-card row, sorts by
`finalReturnInr` descending, and slices the top 3. Crucially the sort/slice
happens **after** the fee+milestone adjustment, so all eligible cards are scored
before the top 3 is chosen (never rank on spend return then adjust).

---

## 4. Where each piece lives

| Concern | File |
|---|---|
| Filter / fee / milestone / finalize (Steps 1, 3, 4) | `src/lib/logic/advisor/scoring.ts` |
| `MockCard` shape (+ `invitation_only`) | `src/lib/logic/advisor/cards.ts` |
| DB hydration incl. milestones + `invitation_only` | `src/lib/advisor/cache.ts` |
| Optional profile fields on all 8 input schemas | `src/schemas/advisor.ts` |
| Income enum labels / ranges per employment type | `src/schemas/userInfoSchema.ts` |
| Travel engine (Step 2 + wiring) | `src/lib/logic/advisor/engine.ts` |
| All-rounder engine | `src/lib/logic/advisor/allrounderEngine.ts` |
| Food engine | `src/lib/logic/advisor/foodCardEngine.ts` |
| Shopping engine | `src/lib/logic/advisor/shoppingCardEngine.ts` |
| API routes (pass profile + milestones) | `src/app/api/recommend/**/route.ts` |
| Chat dispatch + `annualReturn` normaliser | `src/app/api/recommend/route.ts`, `src/lib/logic/advisor/present/cards.ts` |
| Demo UI + income dropdowns + breakdown block | `src/app/demo/page.tsx`, `src/app/demo/ProfileFields.tsx` |
| Milestone Mongoose model | `src/models/CardMilestone.ts` |

---

## 5. Notes, edge cases & gotchas

- **Milestones join by slug.** `card._id === card.slug === milestone.cardSlug`.
  If you ever change `toMockCard` to key `_id` off Mongo's `ObjectId`, milestone
  lookups break silently (they'd return nothing, not error).
- **Chat route has no income filter.** `/api/recommend` (chat) passes milestones
  but no `profile`, because the chat flow doesn't collect employment/income yet.
  It still applies fees + milestones. Add profile collection there when needed.
- **Scripts still compile.** `options` is optional, so
  `scripts/smoke-recommend.ts` / `regression-snapshot.ts` compile unchanged —
  but note they now always get fee deduction (and 0 milestones without options),
  so their snapshot numbers shifted intentionally.
- **`invitation_only` must be in the cache projection.** It's on the Card model
  but was previously not `.select()`-ed. If a new filter field is added, remember
  to add it to both the projection in `cache.ts` and `toMockCard`.
- **Reward caps live in Step 2**, not here. Milestones and fees are on top of an
  already cap-respected spend return.

---

## 6. How to verify a change

1. `npx tsc --noEmit` and eslint on the touched files.
2. Unit-test the pure helpers directly (no DB): import from `scoring.ts` and
   assert mutual-exclusivity, monthly threshold flip at exactly `annual/12`,
   `one_time` exclusion, fee-waiver boundaries, and the income midpoints.
3. `npm run dev`, then curl each endpoint:
   - no profile → 200, rows carry `feeInr/milestoneReturnInr/finalReturnInr`,
     sorted by `finalReturnInr`.
   - `salaried + below_30k` → premium cards (high `min_salary_inr`) disappear.
   - `self_employed + 50l_to_1cr` → full set returns.
   - invitation-only cards never appear.
4. Open `/demo`, exercise all 8 tabs: dropdowns filter income options per
   employment type (retired shows `1l_to_2l`, student hides income), and the
   "Final return breakdown" block matches the API.
5. If `cardmilestones` is empty in staging, seed via the admin bulk-milestones
   upload at `/admin/advisor` (columns per `src/lib/advisor/bulkMilestones.ts`).
