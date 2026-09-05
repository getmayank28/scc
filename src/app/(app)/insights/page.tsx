"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useGetInsightsQuery } from "@/store/api";
import {
  KIND_LABEL,
  type InsightKind,
  type InsightsPayload,
} from "@/lib/insights/clientTypes";
import { RP_VALUE_INR } from "@/lib/insights/rewardPoints";
import { buildWalletSummaries } from "@/lib/insights/walletSummary";
import WalletHeaderStrip from "./components/WalletHeaderStrip";
import WalletCardTile from "./components/WalletCardTile";
import BenefitCard from "./components/BenefitCard";
import RewardPointsPanel from "./components/RewardPointsPanel";
import { Button } from "@/components/ui/stateful-button";
import Typography from "@/components/Typography/Typography";

/** What the value figure on a benefit card represents, per mechanic. */
const VALUE_CAPTION: Record<InsightKind, string> = {
  milestone: "Reward value",
  reward_cap: "Cap ceiling value",
  fee_waiver: "Waiver value",
  unused_benefit: "Unredeemed value",
};

const KIND_ORDER: InsightKind[] = [
  "milestone",
  "fee_waiver",
  "reward_cap",
  "unused_benefit",
];

export default function InsightsPage() {
  const { data, isFetching, isError, refetch } = useGetInsightsQuery({});
  const payload = data as InsightsPayload | undefined;

  /** null = no card inspected, so the drawer is closed. A slug opens it. */
  const [selected, setSelected] = useState<string | null>(null);
  const [kind, setKind] = useState<InsightKind | "all">("all");

  // The drawer only exists once a card is picked, and it sits below the fold, so
  // a selection that revealed off-screen content would read as a dead click.
  // The ref sits on the points+drawer wrapper, not the drawer alone.
  const scrollTargetRef = useRef<HTMLDivElement | null>(null);
  /** Set when a click opened the drawer; consumed by the scroll effect below. */
  const [pendingScroll, setPendingScroll] = useState(false);

  const summaries = useMemo(
    () => (payload ? buildWalletSummaries(payload) : []),
    [payload],
  );

  const active = useMemo(
    () => summaries.find((s) => s.slug === selected) ?? null,
    [summaries, selected],
  );

  // The drawer's source list. Empty until a card is selected — the whole-wallet
  // feed is deliberately not a state the drawer can be in.
  const scoped = useMemo(() => active?.insights ?? [], [active]);

  const visible = useMemo(
    () => (kind === "all" ? scoped : scoped.filter((i) => i.kind === kind)),
    [scoped, kind],
  );

  // Kind pills only offer mechanics the current scope actually contains, so a
  // pill never leads to an empty drawer.
  const kindTabs = useMemo(() => {
    const counts = new Map<InsightKind, number>();
    for (const i of scoped) counts.set(i.kind, (counts.get(i.kind) ?? 0) + 1);
    return KIND_ORDER.filter((k) => counts.has(k)).map((k) => ({
      key: k,
      label: KIND_LABEL[k],
      count: counts.get(k) ?? 0,
    }));
  }, [scoped]);

  // The points panel stays on screen whether or not a card is open, so its
  // figures fall back to the wallet totals when nothing is selected.
  const rp = payload?.rewardPoints;
  const scopePoints = active ? active.points : Math.round(rp?.totalPoints ?? 0);
  const scopeAtRisk = active
    ? active.atRiskInr
    : (payload?.totalAtRiskInr ?? 0);
  const scopeMonthPoints = Math.round(
    active ? (rp?.monthByCard?.[active.slug] ?? 0) : (rp?.pointsThisMonth ?? 0),
  );

  const selectCard = useCallback(
    (slug: string) => {
      // Re-selecting the open card closes the drawer again.
      const opening = selected !== slug;
      setSelected(opening ? slug : null);
      setKind("all");
      // The drawer has not mounted yet, so the scroll is deferred to the layout
      // effect below rather than attempted here.
      setPendingScroll(opening);
    },
    [selected],
  );

  // Scroll the drawer into view once it has actually been committed to the DOM.
  // A layout effect is what makes this reliable: it runs after the drawer node
  // exists and has been laid out, but before paint, so the user never sees the
  // page sitting at the old offset.
  //
  // `scrollIntoView` rather than `window.scrollTo`: in this app the document
  // itself does not scroll — the root layout sizes <body> to the viewport and
  // the overflow lives there — so window-level scrolling is a silent no-op.
  // Letting the browser walk to whatever the real scroll container is keeps
  // this working regardless of where that overflow ends up living.
  useLayoutEffect(() => {
    if (!pendingScroll) return;
    setPendingScroll(false);

    const el = scrollTargetRef.current;
    if (!el) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    // `scroll-mt-24` on the wrapper supplies the offset for the fixed header.
    el.scrollIntoView({
      block: "start",
      behavior: reduced ? "auto" : "smooth",
    });
  }, [pendingScroll]);

  if (isError) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-brown-background pt-20">
        <div className="flex flex-col items-center gap-4">
          <Typography variant="h3">Could not load your insights</Typography>
          <Button onClick={() => refetch()}>Try again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-brown-background pb-24 pt-20 text-white max-md:px-5 max-md:pb-32 max-md:pt-20">
      <div className="mx-auto w-full max-w-6xl space-y-6 px-8 max-md:space-y-7 max-md:px-0">
        {/* ── Title + headline figures ─────────────────────────────────── */}
        <header className="flex items-start justify-between gap-8 max-lg:flex-col">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-6 bg-primary-orange" />
              <p className="font-satoshi text-[10px] font-medium uppercase tracking-[0.28em] text-secondary-gray">
                Intelligence just for you
              </p>
            </div>
            <h1 className="font-satoshi mt-3 text-[44px] font-bold leading-[1.05] tracking-[-0.03em] text-white max-md:text-[30px]">
              Credit Insights
            </h1>
            <p className="font-satoshi mt-3 max-w-lg text-[14px] font-light leading-relaxed text-secondary-gray">
              Rewards, waivers and benefits your cards forfeit if nothing
              changes this billing cycle.
            </p>
          </div>

          {payload && !isFetching ? (
            <WalletHeaderStrip
              atRiskInr={payload.totalAtRiskInr}
              points={Math.round(rp?.totalPoints ?? 0)}
              pointsValueInr={rp?.valueInr ?? 0}
            />
          ) : (
            <div className="h-[92px] w-full max-w-md animate-pulse rounded-xl bg-white/5 lg:w-[440px]" />
          )}
        </header>

        {/* ── Wallet strip ─────────────────────────────────────────────── */}
        <section aria-label="Your cards" className="space-y-4">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-satoshi text-[10px] font-medium uppercase tracking-[0.22em] text-secondary-gray">
              Select asset to inspect
            </h2>
            <p className="font-satoshi text-[11px] text-secondary-gray max-sm:hidden">
              {active
                ? "Click the selected card again to close its overview"
                : "Click a card to open its benefits overview"}
            </p>
          </div>

          {isFetching && !payload ? (
            <WalletSkeleton />
          ) : (
            <div className="grid grid-cols-3 gap-5 max-lg:grid-cols-2 max-sm:grid-cols-1">
              {summaries.map((s) => (
                <WalletCardTile
                  key={s.slug}
                  summary={s}
                  selected={s.slug === selected}
                  pointValueInr={RP_VALUE_INR}
                  onSelect={() => selectCard(s.slug)}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Points + drawer ──────────────────────────────────────────────
            Scrolled to as one unit: both figures describe the selected card,
            so bringing the drawer into view while leaving its points balance
            behind would split a single reading in half. Anchoring at the
            points panel keeps the pair together. */}
        <div
          ref={scrollTargetRef}
          className="scroll-mt-24 space-y-10 max-md:space-y-7"
        >
          {/* FiSense reward points */}
          {rp && !isFetching && (
            <RewardPointsPanel
              rp={rp}
              visiblePoints={scopePoints}
              visibleMonthPoints={scopeMonthPoints}
              scopeLabel={active?.name ?? null}
            />
          )}

          {/* Contextual benefits drawer — only once a card is picked */}
          {active && (
            <section
              aria-label={`${active.name} benefits and protection`}
              className="animate-insight-in rounded-2xl border border-primary-orange/25 bg-brown-sidebar/50 p-7 max-md:p-5"
            >
              <div className="flex flex-wrap items-end justify-between gap-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary-orange" />
                    <p className="font-satoshi text-[10px] font-medium uppercase tracking-[0.2em] text-secondary-gray">
                      {active.name} active overview
                    </p>
                  </div>
                  <h2 className="font-satoshi mt-2 text-[26px] font-semibold tracking-[-0.02em] text-white max-md:text-[20px]">
                    {active.name} milestones &amp; protection
                  </h2>
                </div>

                {/* Kind tabs */}
                <nav
                  aria-label="Filter by type"
                  className="no-scrollbar flex items-center gap-1 overflow-x-auto rounded-lg border border-brown-border bg-brown-background/50 p-1"
                >
                  <KindTab
                    label="All"
                    count={scoped.length}
                    active={kind === "all"}
                    onClick={() => setKind("all")}
                  />
                  {kindTabs.map((t) => (
                    <KindTab
                      key={t.key}
                      label={t.label}
                      count={t.count}
                      active={kind === t.key}
                      onClick={() => setKind(t.key)}
                    />
                  ))}
                </nav>
              </div>

              <div className="mt-6">
                {visible.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-16">
                    <p className="font-satoshi text-center text-[14px] text-white/45">
                      Nothing needs attention on this card right now.
                    </p>
                    {kind !== "all" && (
                      <button
                        onClick={() => setKind("all")}
                        className="font-satoshi text-[12px] text-primary-orange underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-orange"
                      >
                        Show everything on this card
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
                    {visible.map((i, idx) => (
                      <BenefitCard
                        key={i.id}
                        insight={i}
                        index={idx}
                        valueCaption={VALUE_CAPTION[i.kind]}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Scope footer — keeps the drawer's own totals honest. */}
              {visible.length > 0 && (
                <div className="font-satoshi mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-brown-border/70 pt-5 text-[11px] text-secondary-gray">
                  <span>
                    <span className="font-semibold text-primary-orange">
                      ₹{scopeAtRisk.toLocaleString("en-IN")}
                    </span>{" "}
                    at risk in this view
                  </span>
                  <span>
                    Showing{" "}
                    <span className="font-semibold text-white">
                      {visible.length}
                    </span>{" "}
                    of {scoped.length} tracked
                  </span>
                </div>
              )}
            </section>
          )}
        </div>

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

        <footer className="font-satoshi flex items-center gap-2 border-t border-brown-border pt-8 text-[12px] text-secondary-gray">
          <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500/80" />
          <span>
            Live card catalogue connected. Spend history simulated for this
            preview.
          </span>
        </footer>
      </div>
    </div>
  );
}

/** One tab in the drawer's mechanic filter. */
function KindTab({
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
      aria-pressed={active}
      className={`font-satoshi whitespace-nowrap rounded-md px-3.5 py-2 text-[12px] font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-orange ${
        active
          ? "bg-brown-sidebar text-white"
          : "text-secondary-gray hover:text-white"
      }`}
    >
      {label}
      <span className="ml-1.5 opacity-60">({count})</span>
    </button>
  );
}

function WalletSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-5 max-lg:grid-cols-2 max-sm:grid-cols-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-brown-border bg-brown-sidebar/60 p-4"
        >
          <div className="aspect-[1.586/1] w-full animate-pulse rounded-xl bg-white/5" />
          <div className="mt-4 h-4 w-2/3 animate-pulse rounded bg-white/10" />
          <div className="mt-4 h-14 w-full animate-pulse rounded-lg bg-white/5" />
        </div>
      ))}
    </div>
  );
}
