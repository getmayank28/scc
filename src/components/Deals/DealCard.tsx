"use client";

import { useState } from "react";
import dayjs from "dayjs";
import { ArrowUpRight, Check, Copy } from "lucide-react";
import toast from "react-hot-toast";
import { outUrl } from "@/lib/cuelinks/outUrl";
import { useAnalytics } from "@/lib/analytics/hooks/useAnalytics";
import { EventName } from "@/lib/analytics/types";
import { cn } from "@/lib/utils/index";
import { stackedPercent } from "@/lib/deals/discount";
import type { Deal } from "@/types/deals";

/** Whole days until the deal ends, counting today as 0; null when open-ended. */
export function daysLeft(endDate: string | null): number | null {
  if (!endDate) return null;
  return Math.max(0, dayjs(endDate).startOf("day").diff(dayjs().startOf("day"), "day"));
}

/** Deals ending within this many days get the urgent treatment. */
export const ENDING_SOON_DAYS = 3;

function EndsLabel({ endDate }: { endDate: string | null }) {
  const days = daysLeft(endDate);
  if (days === null) return null;
  const urgent = days < ENDING_SOON_DAYS;
  return (
    <span className={cn("text-[11px] whitespace-nowrap", urgent ? "font-semibold text-primary-orange" : "text-white/45")}>
      {days === 0
        ? "Ends today"
        : days === 1
          ? "Ends tomorrow"
          : urgent
            ? `Ends in ${days} days`
            : `Ends ${dayjs(endDate).format("D MMM")}`}
    </span>
  );
}

/**
 * The one muted line under a deal's title: discount (orange), the total with
 * the user's card, any bank restriction, and when it ends.
 */
function DealMeta({
  deal,
  cardRatePct,
  bankHeld,
}: {
  deal: Deal;
  cardRatePct?: number;
  bankHeld: boolean;
}) {
  const pct = deal.discount?.percent;
  // A bank-only deal is paid with that bank's card, not our pick, so no total.
  const rate = deal.bank ? 0 : (cardRatePct ?? 0);
  const stacked = pct && rate > 0 ? Math.round(stackedPercent(pct, rate)) : null;
  // At 95% off the card adds under a point; "≈95% with your card" is just noise.
  const total = stacked && stacked > pct! ? stacked : null;

  const parts: React.ReactNode[] = [];
  if (deal.discount) {
    parts.push(<span className="font-semibold text-primary-orange">{deal.discount.label}</span>);
  }
  if (total) {
    parts.push(
      <span title={`${deal.discount!.label} + ${rate}% back from your card on what you pay`}>
        ≈{total}% with your card
      </span>,
    );
  } else if (rate > 0) {
    parts.push(<span>+{rate}% card back</span>);
  }
  if (deal.bank) {
    parts.push(
      bankHeld ? (
        <span className="text-secondary-success">Works with your {deal.bank} card</span>
      ) : (
        <span>{deal.bank} cards only</span>
      ),
    );
  }
  if (deal.endDate) parts.push(<EndsLabel endDate={deal.endDate} />);

  if (!parts.length) return null;
  return (
    <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-white/50">
      {parts.map((part, i) => (
        <span key={i} className="inline-flex items-center gap-1.5">
          {i > 0 && <span aria-hidden>·</span>}
          {part}
        </span>
      ))}
    </p>
  );
}

/**
 * One live deal: what it is, its code (copyable), when it ends, and a
 * "Shop" link through /api/out so the click is tracked and earns.
 *
 * `card` stacks the actions under the text; `row` puts them alongside.
 */
export function DealCard({
  deal,
  merchant,
  merchantName,
  onMerchantClick,
  surface,
  cardId,
  cardRatePct,
  walletBanks = [],
  variant = "card",
}: {
  deal: Deal;
  merchant: string;
  /** Shown above the title when deals from several stores are mixed. */
  merchantName?: string;
  /** Makes `merchantName` a link, e.g. to open that store's drawer. */
  onMerchantClick?: () => void;
  surface: "deals" | "optimizer";
  /** Card we told the user to pay with, if any; tagged on the click. */
  cardId?: string;
  /** That card's % back here, to show the stacked saving. */
  cardRatePct?: number;
  /** Banks the user holds a card from, to mark bank-only deals they qualify for. */
  walletBanks?: string[];
  variant?: "card" | "row";
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

  const bankHeld = !!deal.bank && walletBanks.includes(deal.bank);
  const href = outUrl({ type: "offer", id: String(deal.offerId), surface, card: cardId });

  const codeButton = deal.couponCode && (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-white/20 px-2.5 py-1.5 font-mono text-xs text-white hover:border-white/45 cursor-pointer max-sm:py-1 max-sm:text-[11px]"
      aria-label={`Copy code ${deal.couponCode}`}
    >
      {deal.couponCode}
      {copied ? <Check className="size-3.5 text-primary-orange" /> : <Copy className="size-3.5 text-white/50" />}
    </button>
  );

  const shopLink = (className: string, label: React.ReactNode) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      onClick={() => track(EventName.DEAL_CLICKED, props)}
      className={className}
      aria-label={`Shop: ${deal.title}`}
    >
      {label}
    </a>
  );

  // Desktop: code + "Shop" pill. Phones swap these for the code under the
  // text and a round shop button on the right (see below).
  const actions = (
    <div className="flex shrink-0 items-center gap-2 max-sm:hidden">
      {codeButton}
      {shopLink(
        "inline-flex items-center gap-1 rounded-full bg-primary-orange/85 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-primary-orange",
        <>
          Shop
          <ArrowUpRight className="size-3.5" />
        </>,
      )}
    </div>
  );
  const mobileShop = shopLink(
    "hidden size-9 shrink-0 items-center justify-center self-center rounded-full bg-primary-orange/85 text-white max-sm:flex",
    <ArrowUpRight className="size-4" />,
  );

  const text = (
    <div className="min-w-0 flex-1">
      {merchantName &&
        (onMerchantClick ? (
          <button
            type="button"
            onClick={onMerchantClick}
            className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/45 hover:text-primary-orange cursor-pointer max-sm:mb-0.5 max-sm:text-[10px]"
          >
            {merchantName} →
          </button>
        ) : (
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/45 max-sm:mb-0.5 max-sm:text-[10px]">
            {merchantName}
          </p>
        ))}
      <p className="line-clamp-2 text-sm font-medium leading-snug text-white max-sm:text-[13px]">{deal.title}</p>
      <div className="mt-1.5 max-sm:mt-1">
        <DealMeta deal={deal} cardRatePct={cardRatePct} bankHeld={bankHeld} />
      </div>
      {codeButton && <div className="mt-2 hidden max-sm:block">{codeButton}</div>}
    </div>
  );

  if (variant === "row") {
    return (
      <div className="flex items-center gap-4 rounded-xl bg-white/[0.04] px-4 py-3 max-sm:gap-3 max-sm:px-3.5">
        {text}
        {actions}
        {mobileShop}
      </div>
    );
  }

  return (
    <div className="flex gap-3 rounded-xl bg-white/[0.04] p-4 max-sm:p-3.5">
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        {text}
        <div className="mt-auto max-sm:hidden">{actions}</div>
      </div>
      {mobileShop}
    </div>
  );
}
