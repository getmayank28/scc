"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Tag } from "lucide-react";
import { DealCard } from "@/components/Deals/DealCard";
import { useGetDealsQuery } from "@/store/userApi";
import { useAnalytics } from "@/lib/analytics/hooks/useAnalytics";
import { EventName } from "@/lib/analytics/types";
import { ROUTES } from "@/lib/constants/routes";

/**
 * "Live deals at <merchant>" under an optimizer result: the merchant's
 * Cuelinks coupons, to stack with the card the optimizer just picked. Renders
 * nothing when the merchant has no live deals, so most runs are unchanged.
 *
 * The card comes from the optimizer's own result (amount-aware), so the deals
 * request skips the server-side card pick (`cards: false`).
 */

const SHOWN = 3;

export function OptimizerDeals({
  portalSlug,
  merchantName,
  cardId,
  cardName,
}: {
  portalSlug: string;
  merchantName: string;
  cardId: string;
  cardName: string;
}) {
  const { data } = useGetDealsQuery({ portal: portalSlug, cards: false });
  const { track } = useAnalytics();
  const deals = data?.merchants[0]?.deals ?? [];
  const tracked = useRef<string | null>(null);

  useEffect(() => {
    if (!deals.length || tracked.current === portalSlug) return;
    tracked.current = portalSlug;
    track(EventName.DEALS_VIEWED, { surface: "optimizer", merchantCount: 1, dealCount: deals.length });
  }, [deals.length, portalSlug, track]);

  if (!deals.length) return null;

  return (
    <section className="mt-6 flex flex-col gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-5 max-md:p-4">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-white/5 text-primary-orange">
          <Tag className="size-4" />
        </div>
        <div className="mr-auto">
          <h3 className="text-base font-medium text-white">Live deals at {merchantName}</h3>
          <p className="text-xs text-white/60">
            Use a code, then pay with your <span className="text-white">{cardName}</span> to stack
            both.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-3 max-lg:grid-cols-1 gap-3">
        {deals.slice(0, SHOWN).map((d) => (
          <DealCard key={d.offerId} deal={d} merchant={portalSlug} surface="optimizer" cardId={cardId} />
        ))}
      </div>
      <Link
        href={ROUTES.DEALS}
        className="inline-flex items-center gap-1 self-start text-xs font-semibold text-primary-orange hover:underline"
      >
        {deals.length > SHOWN ? `See all ${deals.length} deals` : "See deals at other stores"}
        <ArrowRight className="size-3.5" />
      </Link>
    </section>
  );
}
