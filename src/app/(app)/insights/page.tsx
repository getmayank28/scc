"use client";

import { useMemo, useState } from "react";
import { useGetInsightsQuery } from "@/store/api";
import {
  KIND_LABEL,
  type ClientInsight,
  type InsightKind,
  type InsightsPayload,
} from "@/lib/insights/clientTypes";
import AtRiskCounter from "./components/AtRiskCounter";
import InsightRow from "./components/InsightRow";
import RewardPointsBar from "./components/RewardPointsBar";
import { Button } from "@/components/ui/stateful-button";
import Typography from "@/components/Typography/Typography";

const FILTERS: { key: InsightKind | "all"; label: string }[] = [
  { key: "all", label: "Everything" },
  { key: "milestone", label: KIND_LABEL.milestone },
  { key: "reward_cap", label: KIND_LABEL.reward_cap },
  { key: "fee_waiver", label: KIND_LABEL.fee_waiver },
  { key: "unused_benefit", label: KIND_LABEL.unused_benefit },
];

/** What the right-column figure represents, per mechanic. */
const VALUE_CAPTION: Record<InsightKind, string> = {
  milestone: "Reward value",
  reward_cap: "Cap ceiling value",
  fee_waiver: "Waiver value",
  unused_benefit: "Unredeemed value",
};

export default function InsightsPage() {
  const { data, isFetching, isError, refetch } = useGetInsightsQuery({});
  const payload = data as InsightsPayload | undefined;
  const [filter, setFilter] = useState<InsightKind | "all">("all");
  const [cardFilter, setCardFilter] = useState<string>("all");

  const all = useMemo(() => payload?.insights ?? [], [payload?.insights]);

  // The two filters compose: a card selection narrows the wallet, a kind
  // selection narrows the mechanic, and the feed is the intersection.
  const insights = useMemo(
    () =>
      all.filter(
        (i) =>
          (filter === "all" || i.kind === filter) &&
          (cardFilter === "all" || i.cardSlug === cardFilter),
      ),
    [all, filter, cardFilter],
  );

  // Only cards that actually carry insights are worth offering as filters —
  // a pill that always yields an empty feed is noise.
  const cardOptions = useMemo(() => {
    const byslug = new Map<string, { slug: string; name: string }>();
    for (const i of all) {
      if (!byslug.has(i.cardSlug)) {
        byslug.set(i.cardSlug, { slug: i.cardSlug, name: i.cardName });
      }
    }
    return [...byslug.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [all]);

  // The nearest live deadline within the CURRENT view, so the hero and the
  // feed below it always describe the same set.
  const soonest = useMemo(() => {
    const dated = insights.filter(
      (i): i is ClientInsight & { deadline: string; daysRemaining: number } =>
        i.deadline !== null && i.daysRemaining !== null && i.daysRemaining > 0,
    );
    if (!dated.length) return null;
    return dated.reduce((a, b) => (b.daysRemaining < a.daysRemaining ? b : a));
  }, [insights]);

  // Headline total tracks the filtered view. Mirrors the server's rule:
  // only items with a deadline and a live action contribute.
  const visibleAtRiskInr = useMemo(
    () =>
      Math.round(
        insights
          .filter((i) => i.deadline !== null)
          .reduce((t, i) => t + i.valueAtRiskInr, 0),
      ),
    [insights],
  );

  const visibleCardCount = useMemo(
    () => new Set(insights.map((i) => i.cardSlug)).size,
    [insights],
  );

  // Points track the CARD filter only — accrual is a property of spend, not of
  // which mechanic the user is currently reading about.
  const rp = payload?.rewardPoints;
  const visiblePoints =
    cardFilter === "all"
      ? (rp?.totalPoints ?? 0)
      : (rp?.byCard?.[cardFilter] ?? 0);
  const visibleMonthPoints =
    cardFilter === "all"
      ? (rp?.pointsThisMonth ?? 0)
      : (rp?.monthByCard?.[cardFilter] ?? 0);
  const scopeLabel =
    cardFilter === "all"
      ? null
      : (cardOptions.find((c) => c.slug === cardFilter)?.name ?? null);

  // Counts are measured against the OTHER filter's current selection, so a
  // pill's number always matches what selecting it would actually show.
  const countFor = (k: InsightKind | "all") =>
    all.filter(
      (i) =>
        (k === "all" || i.kind === k) &&
        (cardFilter === "all" || i.cardSlug === cardFilter),
    ).length;

  const countForCard = (slug: string) =>
    all.filter(
      (i) =>
        (slug === "all" || i.cardSlug === slug) &&
        (filter === "all" || i.kind === filter),
    ).length;

  if (isError) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-brown-background">
        <div className="flex flex-col items-center gap-4">
          <Typography variant="h3">Could not load your insights</Typography>
          <Button onClick={() => refetch()}>Try again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-brown-background pb-24 pt-28 text-white max-md:px-5 max-md:pb-32 max-md:pt-20">
      <div className="mx-auto w-full max-w-5xl space-y-12 px-8 max-md:space-y-8 max-md:px-0">
        {/* Hero */}
        {isFetching && !payload ? (
          <HeroSkeleton />
        ) : (
          <AtRiskCounter
            totalInr={visibleAtRiskInr}
            soonestDays={soonest?.daysRemaining ?? 0}
            soonestLabel={
              soonest ? formatDeadline(soonest.deadline) : "No deadline"
            }
            itemCount={insights.length}
            cardCount={visibleCardCount}
          />
        )}

        {/* Reward points */}
        {rp && !isFetching && (
          <RewardPointsBar
            rp={rp}
            visiblePoints={visiblePoints}
            visibleMonthPoints={visibleMonthPoints}
            scopeLabel={scopeLabel}
          />
        )}

        {/* Filters */}
        <div className="space-y-3 border-y border-brown-border/70 py-4">
          {/* Card */}
          {cardOptions.length > 1 && (
            <nav
              aria-label="Filter by card"
              className="no-scrollbar flex items-center gap-2 overflow-x-auto text-xs"
            >
              <span className="font-satoshi shrink-0 pr-1 text-[10px] uppercase tracking-[0.18em] text-secondary-gray">
                Card
              </span>
              <FilterPill
                label="All cards"
                count={countForCard("all")}
                active={cardFilter === "all"}
                onClick={() => setCardFilter("all")}
              />
              {cardOptions.map((c) => (
                <FilterPill
                  key={c.slug}
                  label={c.name}
                  count={countForCard(c.slug)}
                  active={cardFilter === c.slug}
                  onClick={() => setCardFilter(c.slug)}
                />
              ))}
            </nav>
          )}

          {/* Kind */}
          <nav
            aria-label="Filter by type"
            className="no-scrollbar flex items-center gap-2 overflow-x-auto text-xs"
          >
            <span className="font-satoshi shrink-0 pr-1 text-[10px] uppercase tracking-[0.18em] text-secondary-gray">
              Type
            </span>
            {FILTERS.map((f) => {
              const n = countFor(f.key);
              return (
                <FilterPill
                  key={f.key}
                  label={f.label}
                  count={n}
                  active={filter === f.key}
                  onClick={() => setFilter(f.key)}
                />
              );
            })}
          </nav>
        </div>

        {/* Feed */}
        <section aria-label="Your card insights" className="space-y-6">
          {isFetching && !payload ? (
            <FeedSkeleton />
          ) : insights.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <p className="font-satoshi text-center text-[14px] text-white/45">
                Nothing needs attention in this view right now.
              </p>
              {(filter !== "all" || cardFilter !== "all") && (
                <button
                  onClick={() => {
                    setFilter("all");
                    setCardFilter("all");
                  }}
                  className="font-satoshi text-[12px] text-primary-orange underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-orange"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            insights.map((i, idx) => (
              <InsightRow
                key={i.id}
                insight={i}
                index={idx}
                valueCaption={VALUE_CAPTION[i.kind]}
              />
            ))
          )}
        </section>

        {payload?.warnings?.length ? (
          <div className="rounded-lg border border-[#E8B84B]/30 bg-[#E8B84B]/8 p-4">
            <p className="font-satoshi mb-2 text-[10px] uppercase tracking-[0.18em] text-[#E8B84B]">
              Demo data check
            </p>
            {payload.warnings.map((w) => (
              <p key={w} className="font-satoshi text-[12px] text-white/65">
                {w}
              </p>
            ))}
          </div>
        ) : null}

        <footer className="flex items-center justify-between gap-4 border-t border-brown-border pt-8 max-sm:flex-col max-sm:items-start">
          <div className="font-satoshi flex items-center gap-2 text-[12px] text-secondary-gray">
            <span className="h-2 w-2 rounded-full bg-emerald-500/80" />
            <span>
              Live card catalogue connected. Spend history simulated for this
              preview.
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}

/**
 * One filter pill. Disabled when selecting it would empty the feed — the count
 * already reflects the other filter's selection, so a zero here means the
 * combination has no results.
 */
function FilterPill({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={count === 0 && !active}
      aria-pressed={active}
      className={`font-satoshi whitespace-nowrap rounded-full border px-4 py-2 font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-orange disabled:cursor-not-allowed disabled:opacity-25 ${
        active
          ? "border-primary-orange bg-primary-orange text-brown-background"
          : "border-brown-border bg-brown-sidebar/40 text-secondary-gray hover:text-white"
      }`}
    >
      {label}
      <span
        className={`ml-1 text-[11px] ${active ? "opacity-80" : "opacity-70"}`}
      >
        {count}
      </span>
    </button>
  );
}

/** "2026-04-01T00:00:00.000Z" → "31 Mar" (the last day inside the window). */
function formatDeadline(iso: string): string {
  const last = new Date(new Date(iso).getTime() - 86_400_000);
  return last.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

function HeroSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-3 w-40 animate-pulse rounded bg-white/10" />
      <div className="h-24 w-80 animate-pulse rounded bg-white/10" />
      <div className="h-4 w-96 animate-pulse rounded bg-white/10" />
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="space-y-6">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-brown-border bg-brown-sidebar p-8"
        >
          <div className="mb-3 h-3 w-40 animate-pulse rounded bg-white/10" />
          <div className="mb-4 h-6 w-2/3 animate-pulse rounded bg-white/10" />
          <div className="h-2 w-full max-w-lg animate-pulse rounded bg-white/10" />
        </div>
      ))}
    </div>
  );
}
