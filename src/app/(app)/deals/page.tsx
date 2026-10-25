"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Clock, CreditCard, Search, Sparkles, Tag, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import {
  DealCard,
  ENDING_SOON_DAYS,
  daysLeft,
} from "@/components/Deals/DealCard";
import { useGetDealsQuery } from "@/store/userApi";
import { useAnalytics } from "@/lib/analytics/hooks/useAnalytics";
import { EventName } from "@/lib/analytics/types";
import useIsMobile from "@/lib/hooks/useIsMobile";
import { cn } from "@/lib/utils/index";
import { DEAL_CATEGORIES, type DealCategory } from "@/lib/deals/categories";
import type { Deal, MerchantDeals } from "@/types/deals";

/**
 * Every live deal we have, as a grid of stores. A store opens into a drawer
 * with its best few deals up top and the rest as compact rows. Above the grid:
 * stores where the user's own cards pay back most, and deals about to expire.
 * Search covers store names and the deals themselves (brands, products, codes).
 */

const TOP_PICKS = 3;
const ROWS_PREVIEW = 10;
const BEST_FOR_CARDS_MAX = 10;
/** Below this many deals a store's drawer skips the filter chips. */
const FILTERS_MIN_DEALS = 5;

const TABS = [
  { key: "best", label: "Best for you" },
  { key: "ending", label: "Ending soon" },
  { key: "stores", label: "Stores" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

type OpenFrom = "grid" | "ending_soon" | "best_for_cards";

/** Deals whose title, description or code mention the search, or null when not searching. */
function matchingDeals(m: MerchantDeals, q: string): Deal[] | null {
  if (!q) return null;
  return m.deals.filter((d) =>
    [d.title, d.description, d.couponCode].some((t) => t?.toLowerCase().includes(q)),
  );
}

const isEndingSoon = (d: Deal) => {
  const days = daysLeft(d.endDate);
  return days !== null && days < ENDING_SOON_DAYS;
};

/** The tile's big number: best % off, else best ₹ off, else how many offers. */
function tileHeadline(deals: Deal[]): { label: string; value: string; short: string } {
  const pct = Math.max(0, ...deals.map((d) => d.discount?.percent ?? 0));
  if (pct > 0) return { label: "Discounts up to", value: `${pct}%`, short: `${pct}% off` };
  const amount = Math.max(0, ...deals.map((d) => d.discount?.amount ?? 0));
  if (amount > 0) {
    const value = `₹${amount.toLocaleString("en-IN")}`;
    return { label: "Save up to", value, short: `${value} off` };
  }
  const n = deals.length;
  return { label: "Live offers", value: String(n), short: `${n} ${n === 1 ? "offer" : "offers"}` };
}

function StoreTile({
  m,
  matches,
  onOpen,
}: {
  m: MerchantDeals;
  /** Deals matching the current search, when the store matched on them. */
  matches?: number;
  onOpen: () => void;
}) {
  const head = tileHeadline(m.deals);
  const rate = m.bestCard?.ratePct ?? 0;
  const endingSoon = m.deals.some(isEndingSoon);
  const subtitle = matches
    ? `${matches} matching ${matches === 1 ? "deal" : "deals"}`
    : `${m.category} · ${m.deals.length} ${m.deals.length === 1 ? "deal" : "deals"}`;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex flex-col rounded-2xl bg-white/[0.04] p-5 text-left transition-colors hover:bg-white/[0.07] cursor-pointer max-sm:flex-row max-sm:items-center max-sm:gap-4 max-sm:rounded-xl max-sm:px-4 max-sm:py-3"
    >
      <div className="min-w-0 max-sm:flex-1">
        <p className="truncate text-base font-medium text-white max-sm:text-sm">{m.merchantName}</p>
        <p className="mt-0.5 truncate text-xs text-white/45">
          {subtitle}
          {endingSoon && <span className="text-primary-orange"> · Ending soon</span>}
        </p>
      </div>

      {/* Phones: one compact row, numbers on the right. */}
      <div className="hidden shrink-0 text-right max-sm:block">
        <p className="text-base font-semibold leading-tight text-white">
          {head.label !== "Live offers" && <span className="text-[11px] font-normal text-white/45">up to </span>}
          {head.short}
        </p>
        {rate > 0 && <p className="mt-0.5 text-xs font-medium text-primary-orange">+{rate}% card back</p>}
      </div>

      <div className="mt-8 flex items-end justify-between gap-4 max-sm:hidden">
        <div>
          <p className="text-xs text-white/45">{head.label}</p>
          <p className="mt-1 text-3xl font-semibold leading-none tracking-tight text-white">{head.value}</p>
        </div>
        {rate > 0 && (
          <div className="text-right" title={`With your ${m.bestCard!.cardName}`}>
            <p className="text-xs text-white/45">Extra card back</p>
            <p className="mt-1 text-xl font-semibold leading-none text-primary-orange">{rate}%</p>
          </div>
        )}
      </div>
    </button>
  );
}

type EndingItem = { m: MerchantDeals; d: Deal };

/** Soonest first, bigger discount first on the same day. */
function endingSoonDeals(merchants: MerchantDeals[]): EndingItem[] {
  return merchants
    .flatMap((m) => m.deals.filter(isEndingSoon).map((d) => ({ m, d })))
    .sort(
      (a, b) =>
        (daysLeft(a.d.endDate) ?? 0) - (daysLeft(b.d.endDate) ?? 0) ||
        (b.d.discount?.percent ?? 0) - (a.d.discount?.percent ?? 0),
    );
}

/** Stores where the user's own cards pay back most — merchant-specific rates first. */
function bestForCardsStores(merchants: MerchantDeals[]): MerchantDeals[] {
  return merchants
    .filter((m) => (m.bestCard?.ratePct ?? 0) > 0)
    .sort(
      (a, b) =>
        Number(b.bestCard!.merchantSpecific) - Number(a.bestCard!.merchantSpecific) ||
        b.bestCard!.ratePct - a.bestCard!.ratePct ||
        b.deals.length - a.deals.length,
    );
}

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      {/* The tab already names the section on phones. */}
      <span className="max-md:hidden">{icon}</span>
      <h2 className="text-base font-semibold text-white max-md:hidden">{title}</h2>
      <span className="text-xs text-white/50">{subtitle}</span>
    </div>
  );
}

const GRID = "grid grid-cols-4 max-xl:grid-cols-3 max-lg:grid-cols-2 max-sm:grid-cols-1 gap-5 max-sm:gap-2";

function EndingSoon({
  items,
  walletBanks,
  onOpen,
}: {
  items: EndingItem[];
  walletBanks: string[];
  onOpen: (m: MerchantDeals, from: OpenFrom) => void;
}) {
  return (
    <section className="mt-8 max-md:mt-4">
      <SectionHeader
        icon={<Clock className="size-4 text-primary-orange" />}
        title="Ending soon"
        subtitle="Grab these before they're gone"
      />
      <div className="mt-3 grid grid-cols-3 max-lg:grid-cols-2 max-sm:grid-cols-1 gap-3 max-sm:gap-2">
        {items.map(({ m, d }) => (
          <div key={`${m.portalSlug}-${d.offerId}`} className="[&>div]:h-full">
            <DealCard
              deal={d}
              merchant={m.portalSlug}
              merchantName={m.merchantName}
              onMerchantClick={() => onOpen(m, "ending_soon")}
              surface="deals"
              cardId={m.bestCard?.cardId}
              cardRatePct={m.bestCard?.ratePct}
              walletBanks={walletBanks}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function BestForCards({
  stores,
  onOpen,
}: {
  stores: MerchantDeals[];
  onOpen: (m: MerchantDeals, from: OpenFrom) => void;
}) {
  return (
    <section className="mt-8 max-md:mt-4">
      <SectionHeader
        icon={<Sparkles className="size-4 text-primary-orange" />}
        title="Best for your cards"
        subtitle={`Top ${stores.length} stores where your cards pay you back the most`}
      />
      <div className={cn("mt-3", GRID)}>
        {stores.map((m) => (
          <StoreTile key={m.portalSlug} m={m} onOpen={() => onOpen(m, "best_for_cards")} />
        ))}
      </div>
    </section>
  );
}

type SheetFilter = "all" | "codes" | "no_code" | "your_bank" | "search";

function StoreSheet({
  m,
  walletEmpty,
  walletBanks,
  query,
  onClose,
}: {
  m: MerchantDeals | null;
  walletEmpty: boolean;
  walletBanks: string[];
  query: string;
  onClose: () => void;
}) {
  const { isMobile } = useIsMobile();
  const [showAll, setShowAll] = useState(false);
  const [filter, setFilter] = useState<SheetFilter>("all");

  const searchMatches = m ? matchingDeals(m, query) : null;
  // Opened from a search that hit its deals (not its name): start on those.
  const startOnSearch =
    !!searchMatches?.length && !!m && !m.merchantName.toLowerCase().includes(query);

  useEffect(() => {
    setShowAll(false);
    setFilter(startOnSearch ? "search" : "all");
    // Reset only when a different store opens.
  }, [m?.portalSlug]);

  // Bank-only deals for banks the user doesn't hold sink to the bottom.
  const ranked = useMemo(() => {
    if (!m) return [];
    if (walletEmpty) return m.deals;
    const usable = (d: Deal) => !d.bank || walletBanks.includes(d.bank);
    return [...m.deals.filter(usable), ...m.deals.filter((d) => !usable(d))];
  }, [m, walletEmpty, walletBanks]);

  // A chip only earns its place when it narrows the list to something non-empty.
  const narrowing: { key: SheetFilter; label: string; deals: Deal[] }[] = [
    { key: "codes", label: "Coupon codes", deals: ranked.filter((d) => d.couponCode) },
    { key: "no_code", label: "No code needed", deals: ranked.filter((d) => !d.couponCode) },
    {
      key: "your_bank",
      label: "Your bank offers",
      deals: ranked.filter((d) => d.bank && walletBanks.includes(d.bank)),
    },
  ];
  const filters: { key: SheetFilter; label: string; deals: Deal[] }[] = [
    { key: "all", label: "All", deals: ranked },
    ...(searchMatches?.length ? [{ key: "search" as const, label: `Matching “${query}”`, deals: searchMatches }] : []),
    ...narrowing.filter((f) => f.deals.length > 0 && f.deals.length < ranked.length),
  ];

  const active = filters.find((f) => f.key === filter) ?? filters[0];
  const showPicks = active.key === "all";
  const picks = showPicks ? active.deals.slice(0, TOP_PICKS) : [];
  const rest = showPicks ? active.deals.slice(TOP_PICKS) : active.deals;
  const shownRest = showAll ? rest : rest.slice(0, ROWS_PREVIEW);

  return (
    <Sheet open={!!m} onOpenChange={(open) => !open && onClose()}>
      {/* Above the mobile bottom bar (z-[9999]), which would otherwise cover the list. */}
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        overlayClassName="z-[10000]"
        closeClassName="top-4 right-4 flex size-8 items-center justify-center rounded-full bg-white/10 text-white opacity-100 hover:bg-white/20 focus:ring-0 focus:ring-offset-0 data-[state=open]:bg-white/10 max-md:top-5"
        className={cn(
          "z-[10000] flex flex-col gap-0 overflow-hidden border-white/10 bg-brown-background p-0",
          isMobile ? "max-h-[85dvh] rounded-t-2xl border-t" : "w-full sm:max-w-xl",
        )}
      >
        {m && (
          <>
            {isMobile && <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-white/20" aria-hidden />}
            <div className="flex shrink-0 flex-col gap-4 border-b border-white/5 p-5 pr-12 max-md:gap-3 max-md:px-4 max-md:pt-3 max-md:pb-4">
              <div>
                <SheetTitle className="text-lg text-white max-md:text-base">{m.merchantName}</SheetTitle>
                <SheetDescription className="text-xs text-white/45">
                  {m.deals.length} {m.deals.length === 1 ? "deal" : "deals"}
                  {m.alsoAt.length > 0 && ` · also on ${m.alsoAt.join(", ")}`}
                </SheetDescription>
              </div>
              {walletEmpty ? (
                <p className="text-xs text-white/50">Add your cards in your profile to see which one to pay with here.</p>
              ) : m.bestCard && m.bestCard.ratePct > 0 ? (
                <div className="flex items-center justify-between gap-4 rounded-xl bg-white/[0.04] px-4 py-3 max-md:px-3.5 max-md:py-2.5">
                  <div className="min-w-0">
                    <p className="text-xs text-white/45">Pay with</p>
                    <p className="mt-0.5 line-clamp-2 text-sm font-medium leading-snug text-white max-md:text-[13px]">
                      {m.bestCard.cardName}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-white/45">
                      {m.bestCard.route === "voucher" ? "Back via gift voucher" : "Card back"}
                    </p>
                    <p className="mt-0.5 text-lg font-semibold leading-none text-primary-orange">
                      {m.bestCard.ratePct}%
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Only the list scrolls; the header above stays put. */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <div className="flex flex-col gap-3 p-5 max-md:gap-2 max-md:px-4 max-md:pt-4 max-md:pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              {filters.length > 1 && (ranked.length > FILTERS_MIN_DEALS || active.key !== "all") && (
                <div className="-mx-5 flex gap-2 overflow-x-auto px-5 max-md:-mx-4 max-md:px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {filters.map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => {
                        setFilter(f.key);
                        setShowAll(false);
                      }}
                      className={cn(
                        "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors",
                        active.key === f.key
                          ? "border-primary-orange bg-primary-orange/15 text-primary-orange"
                          : "border-white/15 text-white/70 hover:border-white/30 hover:text-white",
                      )}
                    >
                      {f.label} <span className="opacity-60">{f.deals.length}</span>
                    </button>
                  ))}
                </div>
              )}

              {picks.length > 0 && rest.length > 0 && (
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/50">
                  Top picks
                </h3>
              )}
              {picks.map((d) => (
                <DealCard
                  key={d.offerId}
                  deal={d}
                  merchant={m.portalSlug}
                  surface="deals"
                  cardId={m.bestCard?.cardId}
                  cardRatePct={m.bestCard?.ratePct}
                  walletBanks={walletBanks}
                />
              ))}

              {rest.length > 0 && (
                <>
                  {showPicks && (
                    <h3 className="mt-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/50">
                      More deals ({rest.length})
                    </h3>
                  )}
                  {shownRest.map((d) => (
                    <DealCard
                      key={d.offerId}
                      deal={d}
                      merchant={m.portalSlug}
                      surface="deals"
                      cardId={m.bestCard?.cardId}
                      cardRatePct={m.bestCard?.ratePct}
                      walletBanks={walletBanks}
                      variant="row"
                    />
                  ))}
                  {rest.length > ROWS_PREVIEW && (
                    <button
                      type="button"
                      onClick={() => setShowAll((v) => !v)}
                      className="self-center rounded-full border border-white/15 px-4 py-1.5 text-xs font-semibold text-white/80 hover:border-white/30 hover:text-white cursor-pointer"
                    >
                      {showAll ? "Show fewer" : `Show all ${rest.length} deals`}
                    </button>
                  )}
                </>
              )}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default function DealsPage() {
  const { data, isLoading, isError } = useGetDealsQuery();
  const { track } = useAnalytics();
  const [query, setQuery] = useState("");
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [category, setCategory] = useState<DealCategory | "All">("All");
  // Null until the user picks one; then "Best for you" when it has anything.
  const [pickedTab, setPickedTab] = useState<TabKey | null>(null);
  const tracked = useRef(false);

  useEffect(() => {
    if (!data || tracked.current) return;
    tracked.current = true;
    track(EventName.DEALS_VIEWED, {
      surface: "deals",
      merchantCount: data.merchants.length,
      dealCount: data.merchants.reduce((n, m) => n + m.deals.length, 0),
    });
  }, [data, track]);

  const all = useMemo(() => data?.merchants ?? [], [data]);
  const walletBanks = useMemo(() => data?.walletBanks ?? [], [data]);
  const q = query.trim().toLowerCase();

  // Search first, then category, so the chips count what the search left.
  // Stores matching by name come first, then by how many of their deals match.
  const searched = useMemo((): { m: MerchantDeals; matches?: number }[] => {
    if (!q) return all.map((m) => ({ m }));
    const byName: { m: MerchantDeals }[] = [];
    const byDeals: { m: MerchantDeals; matches: number }[] = [];
    for (const m of all) {
      if ([m.merchantName, ...m.alsoAt].some((name) => name.toLowerCase().includes(q))) byName.push({ m });
      else {
        const matches = matchingDeals(m, q)!.length;
        if (matches) byDeals.push({ m, matches });
      }
    }
    return [...byName, ...byDeals.sort((a, b) => b.matches - a.matches)];
  }, [all, q]);

  const categories = useMemo(() => {
    const counts = new Map<DealCategory, number>();
    for (const { m } of searched) counts.set(m.category, (counts.get(m.category) ?? 0) + 1);
    return DEAL_CATEGORIES.filter((c) => counts.has(c)).map((c) => ({ name: c, count: counts.get(c)! }));
  }, [searched]);

  const activeCategory = categories.some((c) => c.name === category) ? category : "All";
  const merchants =
    activeCategory === "All" ? searched : searched.filter(({ m }) => m.category === activeCategory);
  const bestStores = useMemo(() => bestForCardsStores(all).slice(0, BEST_FOR_CARDS_MAX), [all]);
  const endingAll = useMemo(() => endingSoonDeals(all), [all]);
  const tab: TabKey = pickedTab ?? (bestStores.length ? "best" : "stores");

  // A search always shows store results, whatever tab is selected.
  const view: TabKey = q ? "stores" : tab;
  const tabCount: Record<TabKey, number> = {
    best: bestStores.length,
    ending: endingAll.length,
    stores: all.length,
  };
  const switchTab = (key: TabKey) => {
    setPickedTab(key);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const totals = useMemo(
    () => ({
      deals: all.reduce((n, m) => n + m.deals.length, 0),
      codes: all.reduce((n, m) => n + m.deals.filter((d) => d.couponCode).length, 0),
    }),
    [all],
  );

  const open = (m: MerchantDeals, from: OpenFrom) => {
    setOpenSlug(m.portalSlug);
    track(EventName.DEALS_STORE_OPENED, { merchant: m.portalSlug, dealCount: m.deals.length, from });
  };
  const openStore = all.find((m) => m.portalSlug === openSlug) ?? null;

  return (
    <div className="flex flex-col p-20 max-md:px-4 max-md:pt-20 max-md:pb-28 min-h-screen bg-brown-background">
      <header>
        <h1 className="text-4xl font-semibold tracking-tight text-white max-md:text-2xl">Deals</h1>
        <p className="mt-2 max-w-xl text-sm text-white/55 max-md:mt-1 max-md:text-xs">
          Live coupons from top stores, plus the card in your wallet that pays you back most.
        </p>
        {totals.deals > 0 && (
          <p className="mt-2 text-xs text-white/35">
            {totals.deals} deals · {totals.codes} codes · {all.length} stores
          </p>
        )}
      </header>

      <div className="relative mt-6 max-w-xl max-md:mt-4">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/40" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search stores, brands or products"
          className="h-12 max-md:h-11 rounded-xl border-white/10 bg-white/[0.04] pl-11 pr-10 text-sm text-white placeholder:text-white/35 focus-visible:border-primary-orange/60 focus-visible:ring-0"
          aria-label="Search stores, brands or products"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/45 hover:bg-white/10 hover:text-white cursor-pointer"
            aria-label="Clear search"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {isLoading && (
        <div className="mt-8 grid grid-cols-4 max-xl:grid-cols-3 max-lg:grid-cols-2 max-sm:grid-cols-1 gap-4">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-white/[0.04]" />
          ))}
        </div>
      )}

      {isError && (
        <p className="mt-8 text-sm text-white/60">Couldn&apos;t load deals. Please try again later.</p>
      )}

      {!isLoading && !isError && all.length > 0 && !q && (
        <div role="tablist" aria-label="Deals view" className="mt-6 flex gap-1 border-b border-white/10 max-md:mt-4 max-md:gap-0">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => switchTab(t.key)}
              className={cn(
                "-mb-px shrink-0 border-b-2 px-4 py-2.5 text-sm font-semibold whitespace-nowrap cursor-pointer transition-colors max-md:flex-1 max-md:px-1 max-md:text-[13px]",
                tab === t.key
                  ? "border-primary-orange text-white"
                  : "border-transparent text-white/55 hover:text-white/85",
              )}
            >
              {t.label}
              <span
                className={cn(
                  "ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] max-md:ml-1",
                  tab === t.key ? "bg-primary-orange/20 text-primary-orange" : "bg-white/10 text-white/60",
                )}
              >
                {tabCount[t.key]}
              </span>
            </button>
          ))}
        </div>
      )}

      {!isLoading && !isError && (all.length === 0 || (view === "stores" && merchants.length === 0)) && (
        <div className="mt-8 flex items-center gap-3 rounded-2xl bg-white/[0.03] p-5 text-sm text-white/70">
          <Tag className="size-4 shrink-0 text-primary-orange" />
          {query ? `No live deals for “${query}”.` : "No live deals right now — check back tomorrow."}
        </div>
      )}

      {view === "best" &&
        (bestStores.length ? (
          <BestForCards stores={bestStores} onOpen={open} />
        ) : (
          <div className="mt-8 flex items-center gap-3 rounded-2xl bg-white/[0.03] p-5 text-sm text-white/70">
            <CreditCard className="size-4 shrink-0 text-primary-orange" />
            {data?.walletEmpty
              ? "Add your cards in your profile to see where they pay you back the most."
              : "None of your cards earn extra at these stores right now."}
          </div>
        ))}

      {view === "ending" &&
        (endingAll.length ? (
          <EndingSoon items={endingAll} walletBanks={walletBanks} onOpen={open} />
        ) : (
          <div className="mt-8 flex items-center gap-3 rounded-2xl bg-white/[0.03] p-5 text-sm text-white/70">
            <Clock className="size-4 shrink-0 text-primary-orange" />
            Nothing is about to expire — check back in a day or two.
          </div>
        ))}

      {view === "stores" && merchants.length > 0 && (
        <section className="mt-8 max-md:mt-4">
          <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-3">
            <h2 className="text-base font-semibold text-white">
              {q ? `Results for “${query.trim()}”` : "All stores"}
            </h2>
            {categories.length > 1 && (
              <div className="flex max-w-full gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {[{ name: "All" as const, count: searched.length }, ...categories].map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setCategory(c.name)}
                    className={cn(
                      "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors",
                      activeCategory === c.name
                        ? "border-primary-orange bg-primary-orange/15 text-primary-orange"
                        : "border-white/15 text-white/70 hover:border-white/30 hover:text-white",
                    )}
                  >
                    {c.name} <span className="opacity-60">{c.count}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className={GRID}>
            {merchants.map(({ m, matches }) => (
              <StoreTile key={m.portalSlug} m={m} matches={matches} onOpen={() => open(m, "grid")} />
            ))}
          </div>
        </section>
      )}

      <StoreSheet
        m={openStore}
        walletEmpty={!!data?.walletEmpty}
        walletBanks={walletBanks}
        query={q}
        onClose={() => setOpenSlug(null)}
      />
    </div>
  );
}
