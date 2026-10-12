# Stage → prod migration: recommendation engine + spend optimizer v2

Copies the advisor engine's card and rules data from `fisense-staging` into a
target database: a rehearsal copy of prod first, then `fisense-prod`. User data
(`users`, `usercards`, `waitlists`, `whatsappmessages`, …) is never read from
stage or written to prod.

## The one rule

Prod and stage card `_id`s never match, and prod `usercards.cardId` points at
prod `_id`s. Cards are therefore matched on **`slug`**: stage data is copied
onto the prod document and the prod `_id` is kept. Never replace a prod card
document wholesale.

## Setup

```sh
cp scripts/migrate/env.example .env.migrate   # fill in both URIs
```

Every script:
- is a dry run unless `--commit` is passed;
- requires `--confirm-db=<target db name>`, and refuses if it doesn't match the target;
- refuses a source database other than `fisense-staging`;
- reads only `SOURCE_MONGODB_URI` and `TARGET_MONGODB_URI`, so a `MONGODB_URI` exported in your shell has no effect.

## Order

Run each step as a dry run, read the output, then run it again with `--commit`.
`T` is the target database name (`fisense-prod-rehearsal`, then `fisense-prod`).

| # | Script | What it does |
|---|---|---|
| 0 | — | Back up the target first: Atlas snapshot plus `mongodump` |
| 1 | `01-prod-card-fixes.ts` | Delete the extra copies of duplicate slugs (newest kept, only if no user holds them); rewrite the 3 renamed slugs from `scripts/data/prod-only-cards.json` |
| 2 | `02-banks.ts` | Sync banks by `_id` (the Standard Chartered slug fix) |
| 3 | `03-cards-by-slug.ts` | Copy stage card data onto prod cards by slug, insert stage-only cards, leave prod-only cards untouched |
| 4 | `04-advisor-collections.ts` | Drop the stale `cardAdvisorKey` indexes on prod's empty `cardbestofs`, then copy `cardrules`, `cardmilestones`, `cardbestofs` (`--replace` to recopy) |
| 5 | `05-indexes.ts` | Create the declared indexes, add-only, with a duplicate preflight for unique indexes |
| 6 | `06-recompute-bestof.ts` | Recompute `cardbestofs` against the target's own data |
| 7 | `07-verify.ts` | Read-only checks; exits non-zero on failure |

```sh
npx tsx --env-file=.env.migrate scripts/migrate/01-prod-card-fixes.ts --confirm-db=$T
npx tsx --env-file=.env.migrate scripts/migrate/01-prod-card-fixes.ts --confirm-db=$T --commit
# … same for 02–06 …
npx tsx --env-file=.env.migrate scripts/migrate/07-verify.ts --confirm-db=$T
```

Steps 1–6 are idempotent; re-running one after a commit reports nothing to do
(step 4 needs `--replace`).

Load the data **before** deploying the new code. Today's `main` doesn't read
`cardrules`, `cardmilestones` or `cardbestofs`, and the extra `cards` fields are
additive, so prod keeps working between the data load and the deploy.

## Rollback

- New collections (`cardrules`, `cardmilestones`, `cardbestofs`): the old code
  ignores them; drop them if needed.
- `cards` / `banks`: restore from the step-0 `mongodump`. `_id`s are unchanged,
  so `usercards` stay linked.

## Known state (2026-10-12)

- 80 cards exist only on prod and are left untouched, listed in
  `scripts/data/prod-only-cards.json`. Three of those are renames handled in
  step 1. The other 77 have `is_active` unset, so the engine ignores them.
- Slice (2 users) and Vistara Platinum (1 user) have no stage data and will
  show base-rate results.
- 3 prod usercards already point at missing card `69cd7a4779ac41bb9051a69e`.
  This predates the migration, and step 7 allows it.
- `cardmilestones` has 1 row for `swiggy-hdfc-bank-credit-card-hdfc-bank`, a slug that exists in neither database. It's copied but never matched, so it does nothing.
- 8 active stage cards with rules produce no best-of rows, because no rule beats
  their base rate. That's expected; the engine uses the base rate for them.
