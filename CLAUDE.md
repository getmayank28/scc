# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev                 # Next.js dev server (PWA disabled in dev)
npm run build               # production build
npm run start               # serve the production build
npm run lint                # next lint (eslint 9, flat config)
npx tsc --noEmit            # type-check without emitting

npm run bestof:recompute    # rebuild the CardBestOf precompute cache for every card
npm run smoke:recommend     # run all 4 phase-2 engines against live Atlas data, print top result
```

- There is **no test runner** configured. Verify pure advisor helpers by importing them directly (see `ai-advisor-logic.md` §6) and verify wiring with `smoke:recommend` + curling endpoints.
- The `scripts/*.ts` files run via `tsx --env-file=.env.local` and read `MONGODB_URI` from `.env.local`. Other useful scripts not wired to npm: `scripts/regression-snapshot.ts`, `scripts/tier-test.ts`, `scripts/backfill-voucher-cap.ts`.
- Path alias: `@/*` → `src/*`.

## Stack

Next.js 15 (App Router, RSC) · React 19 · TypeScript (strict) · MongoDB via Mongoose · NextAuth v4 · Redux Toolkit + RTK Query · Tailwind v4 + shadcn/ui (new-york, `src/components/ui`) · Amplitude analytics · Resend (email) + Gupshup (WhatsApp OTP) · `@ducanh2912/next-pwa`.

## The advisor / recommendation engine (the core of this app)

**Before touching anything under `recommend*`, scoring, or the engines, read `ai-advisor-logic.md`** — it documents the full pipeline end to end. Key points:

- Four independent engines — **travel, all-rounder, food, shopping** — each with a **phase 1** (few inputs, model-estimated spend) and **phase 2** (declared spend) variant, exposed as 8 routes under `src/app/api/recommend/**/route.ts` plus a 9th chat-dispatch route `src/app/api/recommend/route.ts`.
- Engines live in `src/lib/logic/advisor/{engine,allrounderEngine,foodCardEngine,shoppingCardEngine}.ts`. They differ only in how they model spend (Step 2). All share one scoring pipeline in `src/lib/logic/advisor/scoring.ts`:
  `finalReturnInr = spendReturnInr (engine) + milestoneReturnInr − feeInr`, then sort desc and take **top 3**. Sort/slice happens *after* fee+milestone adjustment.
- Steps: (1) `filterEligibleCards` — active, not invitation-only, income eligible (income estimated from bracket **midpoint**); (3) `computeAnnualFeeInr` — waiver-aware, fees always deducted; (4) `computeMilestoneReturnInr` — threshold-checked, honors `mutual_exclusivity_group`/`tier_order`.

### Data flow & caching

- Advisor data lives in the **`fisense-staging`** MongoDB (not the app's main DB). Collections: `cardadvisors`, `cardrules`, `cardbestofs`, `cardmilestones`.
- `AdvisorCache` (`src/lib/advisor/cache.ts`) hydrates active Cards, CardRules, CardBestOf payloads, and CardMilestones into a **process-local cache** (60s TTL, stale-while-revalidate). Routes call `AdvisorCache.ensureFresh()` before scoring. Vercel keeps instances warm so this survives across invocations.
- `toMockCard` sets **`_id = doc.slug`**. Milestones/rules join on the slug (`milestone.cardSlug === card._id`). Never key `_id` off Mongo's ObjectId or these joins break silently.
- **`CardBestOf` is a precompute**: `computeBestOfForCard` (`src/lib/logic/advisor/bestOf.ts`) resolves each card's best reward route per category, respecting caps. Rebuild it with `npm run bestof:recompute` after bulk data or rule changes.
- **Cap groups**: rules in a shared/combined cap group pool their caps and must stay mutually consistent. Admin write routes call `capGroupConflictFor` (`src/lib/advisor/capGroupGuard.ts`) **before** writing so a conflict returns a clean error instead of a post-write 500 during recompute.

Known data hazards (from memory): ~342 empty `card_*` duplicate records corrupt recommendations (real cards use slug-style ids); both Tata Neu HDFC cards fail bestof recompute until their `1:card` cap-group data is fixed.

## App structure

- **Routing** uses App Router route groups: `src/app/(app)/*` (authenticated app: home, spend-optimizer, card-info, redemption, admin, chat, tools, etc.), `src/app/(auth)/*` (sign-in / sign-up / verify), and public pages at the root (`/`, `/about`, `/terms`, `/privacy-policy`, `/legal-compliance`, `/card`, `/demo`).
- **`/demo`** (`src/app/demo/page.tsx`) is the advisor test harness: 8 forms, one per engine/phase, sharing `ProfileFields.tsx`, POSTing via `fetchRecommend` (`src/lib/advisor/client.ts`).
- **Sale funnel** lives in `src/features/sale/*` (self-contained: components/data/hooks/lib). Note: `sale/[merchant]` pages use Satoshi only — no ButlerPro serif.

## Auth & access control

- NextAuth v4 (`src/app/api/auth/[...nextauth]/options.ts`): Credentials (bcrypt, email OTP verification) + Google. JWT sessions. Google sign-ups auto-create verified users.
- **`src/middleware.ts` is the gatekeeper.** It redirects unauthenticated/unverified users to sign-in, forces email verification, and **gates all app routes behind user-info completion** (`hasCompletedUserInfo` → `/user-info`). API routes (`/api/*`) pass through untouched. The `matcher` array must include any new route that needs gating.
- **Admin** is env-based: `isAdmin(email)` checks `ADMIN_EMAILS` (`src/lib/constants/admin.ts`). Admin APIs live under `src/app/api/admin/*`; admin UI at `/admin`.

## Data & client conventions

- **Mongoose models** in `src/models/*.ts`; every DB entry point calls `dbConnect` (`src/lib/utils/dbConnet.ts` — note the misspelled filename), which memoizes the connection. `MONGODB_URI` from env.
- **API responses** use the `ApiSuccess | ApiError` envelope from `src/lib/utils/ApiResponse.ts` (`{ success, message, result }`); `fetchRecommend` and RTK Query rely on the `success` discriminant.
- **Client data fetching** goes through RTK Query (`src/store/api.ts`, `src/store/userApi.ts`) with `tagTypes` for cache invalidation; realtime via `src/store/socket.ts` (WebSocket) and `react-use-websocket`. Store assembled in `src/store/index.ts`.
- **Zod schemas** for validation in `src/schemas/*` (advisor input schemas carry optional profile fields; `userInfoSchema.ts` defines income bracket enums used by the income filter).
- **Feature flags**: `src/lib/constants/featureFlags.ts` (e.g. `WAITLIST`), consumed via `FeatureContext`.
