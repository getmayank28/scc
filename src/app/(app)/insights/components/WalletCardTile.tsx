"use client";

import Image from "next/image";
import { inr, URGENCY_STYLE } from "@/lib/insights/clientTypes";
import { cardArtFor } from "@/lib/insights/cardArt";
import { tileStats, type WalletCardSummary } from "@/lib/insights/walletSummary";

/**
 * One card in the wallet strip — the page's primary control.
 *
 * The tile is a button, not a link: selecting it swaps the drawer below rather
 * than navigating. Selection is carried by an accent border plus a stamp, so
 * the state survives both greyscale and a projector.
 */
export default function WalletCardTile({
  summary,
  selected,
  pointValueInr,
  onSelect,
}: {
  summary: WalletCardSummary;
  selected: boolean;
  pointValueInr: number;
  onSelect: () => void;
}) {
  const art = cardArtFor(summary.slug);
  const [primary, deadline] = tileStats(summary, pointValueInr);
  const style = URGENCY_STYLE[summary.urgency];

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`group flex w-full flex-col gap-4 rounded-2xl border p-4 text-left transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-orange ${
        selected
          ? "border-primary-orange/70 bg-brown-sidebar shadow-[0_10px_44px_-12px_rgba(243,90,19,0.35)]"
          : "border-brown-border bg-brown-sidebar/60 hover:border-brown-border/90 hover:bg-brown-sidebar/80"
      }`}
    >
      {/* Card art */}
      <div className="relative aspect-[1.586/1] w-full overflow-hidden rounded-xl border border-white/5 bg-white/5">
        {art ? (
          <Image
            src={art}
            alt=""
            fill
            sizes="(max-width: 768px) 90vw, 340px"
            className={`object-cover transition-opacity duration-200 ${
              selected ? "opacity-100" : "opacity-75 group-hover:opacity-90"
            }`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-satoshi text-[11px] uppercase tracking-[0.18em] text-white/30">
              {summary.name}
            </span>
          </div>
        )}

        {selected && (
          <span className="font-satoshi absolute right-2.5 top-2.5 rounded-full bg-primary-orange px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-brown-background">
            Selected
          </span>
        )}
      </div>

      {/* Name + exposure */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-satoshi truncate text-[15px] font-semibold tracking-[-0.01em] text-white">
            {summary.name}
          </h3>
          <p className="font-satoshi mt-0.5 text-[11px] text-secondary-gray">
            {summary.insights.length} tracked
            {!summary.isActive && " · delisted"}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <div className="font-satoshi text-[9px] uppercase tracking-[0.16em] text-secondary-gray">
            At risk
          </div>
          <div
            className={`font-satoshi mt-0.5 text-[15px] font-bold tracking-[-0.01em] ${
              summary.atRiskInr > 0 ? style.text : "text-white/35"
            }`}
          >
            {summary.atRiskInr > 0 ? inr(summary.atRiskInr) : "—"}
          </div>
        </div>
      </div>

      {/* Derived stats */}
      <div className="grid grid-cols-2 gap-2">
        <TileStatBox stat={primary} />
        <TileStatBox stat={deadline} />
      </div>
    </button>
  );
}

function TileStatBox({
  stat,
}: {
  stat: { eyebrow: string; value: string; caption: string; alert?: boolean };
}) {
  return (
    <div className="min-w-0 rounded-lg border border-brown-border/70 bg-brown-background/40 px-3 py-2.5">
      <div className="font-satoshi truncate text-[9px] uppercase tracking-[0.14em] text-secondary-gray">
        {stat.eyebrow}
      </div>
      <div className="font-satoshi mt-1 truncate text-[13px] font-semibold text-white">
        {stat.value}
      </div>
      <div
        className={`font-satoshi mt-0.5 truncate text-[10px] ${
          stat.alert ? "text-primary-orange" : "text-secondary-gray"
        }`}
      >
        {stat.caption}
      </div>
    </div>
  );
}
