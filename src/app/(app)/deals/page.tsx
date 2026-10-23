"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Tag } from "lucide-react";
import HeaderText from "@/components/HeaderText/HeaderText";
import { Input } from "@/components/ui/input";
import { BestCardLine, DealCard } from "@/components/Deals/DealCard";
import { useGetDealsQuery } from "@/store/userApi";
import { useAnalytics } from "@/lib/analytics/hooks/useAnalytics";
import { EventName } from "@/lib/analytics/types";
import type { MerchantDeals } from "@/types/deals";

/**
 * Every live deal we have, grouped by merchant, each merchant headed by the
 * card from the user's own wallet that pays them back most there.
 */

const PREVIEW = 4;

function MerchantSection({ m, walletEmpty }: { m: MerchantDeals; walletEmpty: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? m.deals : m.deals.slice(0, PREVIEW);
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-white/5 bg-white/[0.03] p-5 max-md:p-4">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-medium text-white">{m.merchantName}</h2>
          <span className="text-xs text-white/50">
            {m.deals.length} {m.deals.length === 1 ? "deal" : "deals"}
          </span>
        </div>
        <BestCardLine bestCard={m.bestCard} walletEmpty={walletEmpty} />
      </div>
      <div className="grid grid-cols-2 max-lg:grid-cols-1 gap-3">
        {shown.map((d) => (
          <DealCard
            key={d.offerId}
            deal={d}
            merchant={m.portalSlug}
            surface="deals"
            cardId={m.bestCard?.cardId}
          />
        ))}
      </div>
      {m.deals.length > PREVIEW && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="self-start text-xs font-semibold text-primary-orange hover:underline cursor-pointer"
        >
          {expanded ? "Show fewer" : `Show all ${m.deals.length} deals`}
        </button>
      )}
    </section>
  );
}

export default function DealsPage() {
  const { data, isLoading, isError } = useGetDealsQuery();
  const { track } = useAnalytics();
  const [query, setQuery] = useState("");
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

  const merchants = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = data?.merchants ?? [];
    return q ? all.filter((m) => m.merchantName.toLowerCase().includes(q)) : all;
  }, [data, query]);

  return (
    <div className="flex flex-col p-20 max-md:p-4 min-h-screen bg-brown-background">
      <HeaderText
        containerClassName="items-start"
        title="Deals"
        titleVariant="h3"
        titleClassName="font-bold"
        content="Live coupons and offers, with the card from your wallet that earns most at each store."
        contentClassName="text-left text-white/70"
      />

      <div className="relative mt-6 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/50" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a store"
          className="h-10 pl-9"
          aria-label="Search a store"
        />
      </div>

      <div className="mt-6 flex flex-col gap-6">
        {isLoading &&
          [0, 1, 2].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-white/[0.04]" />
          ))}

        {isError && (
          <p className="text-sm text-white/60">Couldn&apos;t load deals. Please try again later.</p>
        )}

        {!isLoading && !isError && merchants.length === 0 && (
          <div className="flex items-center gap-3 rounded-2xl bg-white/[0.03] p-5 text-sm text-white/70">
            <Tag className="size-4 shrink-0 text-primary-orange" />
            {query ? `No live deals for “${query}”.` : "No live deals right now — check back tomorrow."}
          </div>
        )}

        {merchants.map((m) => (
          <MerchantSection key={m.portalSlug} m={m} walletEmpty={!!data?.walletEmpty} />
        ))}
      </div>
    </div>
  );
}
