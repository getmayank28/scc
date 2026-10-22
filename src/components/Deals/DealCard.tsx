"use client";

import { useState } from "react";
import dayjs from "dayjs";
import { ArrowUpRight, Check, Copy, CreditCard } from "lucide-react";
import toast from "react-hot-toast";
import { outUrl } from "@/lib/cuelinks/outUrl";
import { useAnalytics } from "@/lib/analytics/hooks/useAnalytics";
import { EventName } from "@/lib/analytics/types";
import type { Deal, DealBestCard } from "@/types/deals";

/**
 * One live deal: what it is, its code (copyable), when it ends, and a
 * "Shop this deal" link through /api/out so the click is tracked and earns.
 */
export function DealCard({
  deal,
  merchant,
  surface,
  cardId,
}: {
  deal: Deal;
  merchant: string;
  surface: "deals" | "optimizer";
  /** Card we told the user to pay with, if any; tagged on the click. */
  cardId?: string;
}) {
  const { track } = useAnalytics();
  const [copied, setCopied] = useState(false);
  const props = { surface, merchant, offerId: deal.offerId, hasCode: !!deal.couponCode, cardId };

  const copy = async () => {
    if (!deal.couponCode) return;
    try {
      await navigator.clipboard.writeText(deal.couponCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      track(EventName.DEAL_CODE_COPIED, props);
    } catch {
      toast.error("Couldn't copy — select the code instead.");
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-white/[0.04] p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium leading-snug text-white">{deal.title}</p>
        {deal.percentOff ? (
          <span className="shrink-0 rounded-md bg-primary-orange/15 px-2 py-0.5 text-[11px] font-semibold text-primary-orange">
            {deal.percentOff}% off
          </span>
        ) : null}
      </div>
      {deal.bank && (
        <span className="self-start rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/80">
          {deal.bank} cards only
        </span>
      )}
      {deal.description && deal.description !== deal.title && (
        <p className="line-clamp-2 text-xs text-white/60">{deal.description}</p>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-2">
        {deal.couponCode && (
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-2 rounded-lg border border-dashed border-white/25 px-3 py-1.5 font-mono text-xs text-white hover:border-white/50 cursor-pointer"
            aria-label={`Copy code ${deal.couponCode}`}
          >
            {deal.couponCode}
            {copied ? <Check className="size-3.5 text-primary-orange" /> : <Copy className="size-3.5 text-white/60" />}
          </button>
        )}
        <a
          href={outUrl({ type: "offer", id: String(deal.offerId), surface, card: cardId })}
          target="_blank"
          rel="noopener noreferrer sponsored"
          onClick={() => track(EventName.DEAL_CLICKED, props)}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary-orange/80 px-4 py-1.5 text-xs font-semibold text-white hover:bg-primary-orange"
        >
          Shop this deal
          <ArrowUpRight className="size-3.5" />
        </a>
        {deal.endDate && (
          <span className="ml-auto text-[11px] text-white/45">
            Ends {dayjs(deal.endDate).format("D MMM")}
          </span>
        )}
      </div>
    </div>
  );
}

/** "Pay with <card> — X% back", or why there's no pick. */
export function BestCardLine({
  bestCard,
  walletEmpty,
}: {
  bestCard: DealBestCard | null;
  walletEmpty: boolean;
}) {
  if (walletEmpty) {
    return (
      <p className="text-xs text-white/60">
        Add your cards in your profile to see which one to pay with here.
      </p>
    );
  }
  if (!bestCard) return null;
  return (
    <p className="flex items-center gap-2 text-xs text-white/80">
      <CreditCard className="size-3.5 shrink-0 text-primary-orange" />
      <span>
        Pay with <span className="font-semibold text-white">{bestCard.cardName}</span>
        {bestCard.ratePct > 0 && (
          <>
            {" "}— earns <span className="font-semibold text-primary-orange">{bestCard.ratePct}% back</span>
          </>
        )}
        {bestCard.route === "voucher" && " via a gift voucher from your bank's portal"}
        {!bestCard.merchantSpecific && " (your best card for this category)"}
      </span>
    </p>
  );
}
