"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { Check, ChevronDown, MapPin, MessageCircle } from "lucide-react";
import { useAnalytics } from "@/lib/analytics/hooks/useAnalytics";
import { EventName } from "@/lib/analytics/types";
import { usePrefersReducedMotion } from "@/app/sale/[merchant]/hooks/usePrefersReducedMotion";
import { WHATSAPP_URL, feeLabel, inr, voucherLine, type CampaignCard } from "../_data/festive";
import { ApplyButton } from "./ApplyButton";
import { PortraitCard } from "./Hero";
import { WhatsAppLink } from "./Tracked";

/** How long each card stays up before the carousel moves on. */
const AUTOPLAY_MS = 6000;

/**
 * One card at a time: a tab row of all five names, and a panel with the card
 * on the left and its details on the right. Advances on its own; the active
 * tab's progress bar is the timer (its animationend moves to the next card), so
 * pausing the bar pauses the carousel. It pauses on hover/keyboard focus, while off
 * screen, and is off entirely under reduced motion.
 *
 * Every panel is rendered (inactive ones `hidden`) so all card copy stays in
 * the server HTML. A `#<anchor>` in the URL selects that card.
 */
export function CardCarousel({ cards, campaign }: { cards: CampaignCard[]; campaign: string }) {
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [inView, setInView] = useState(false);
  const reduced = usePrefersReducedMotion();
  const { track } = useAnalytics();
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const touchX = useRef<number | null>(null);

  const autoplay = !reduced;
  const paused = hovered || focused || !inView;

  const select = useCallback(
    (i: number, { manual = true, focus = false } = {}) => {
      const next = (i + cards.length) % cards.length;
      setActive(next);
      // Scroll only the tab row sideways; scrollIntoView could move the page.
      const list = listRef.current;
      const tab = tabRefs.current[next];
      if (list && tab) {
        list.scrollTo({
          left: tab.offsetLeft - list.clientWidth / 2 + tab.offsetWidth / 2,
          behavior: "smooth",
        });
      }
      if (focus) tab?.focus();
      if (manual) track(EventName.CAMPAIGN_CARD_SELECTED, { campaign, cardSlug: cards[next].slug });
    },
    [cards, campaign, track],
  );

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.4,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const fromHash = () => {
      const i = cards.findIndex((c) => `#${c.anchor}` === window.location.hash);
      if (i < 0) return;
      setActive(i);
      rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [cards]);

  return (
    <div
      ref={rootRef}
      className="scroll-mt-24"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      // Keyboard focus pauses; a mouse click on a tab shouldn't stop autoplay.
      onFocus={(e) => setFocused((e.target as HTMLElement).matches(":focus-visible"))}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
    >
      <style>{`@keyframes fs-carousel-progress { from { transform: scaleX(0) } to { transform: scaleX(1) } }`}</style>

      {/* Scroll wrapper: the glass track scrolls sideways on phones. */}
      <div
        ref={listRef}
        className="relative overflow-x-auto pb-2 [scrollbar-width:none] md:text-center"
      >
        <div
          role="tablist"
          aria-label="Cards on offer"
          className="flex w-full justify-evenly rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_10px_30px_-15px_rgba(0,0,0,0.8)] backdrop-blur sm:inline-flex sm:w-auto sm:justify-start sm:gap-1 sm:p-1.5"
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") select(active + 1, { focus: true });
            if (e.key === "ArrowLeft") select(active - 1, { focus: true });
          }}
        >
          {cards.map((c, i) => {
            const selected = i === active;
            const accent = c.face.accent;
            return (
              <button
                key={c.slug}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`tab-${c.anchor}`}
                aria-selected={selected}
                aria-controls={`panel-${c.anchor}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => select(i)}
                className={`relative inline-flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium sm:rounded-xl sm:pl-2 sm:pr-4 transition-colors duration-300 ${
                  selected ? "text-white" : "text-white/60 hover:bg-white/[0.05] hover:text-white"
                }`}
              >
                {selected && (
                  // Shared layoutId: the highlight glides from the old tab to the new one.
                  <motion.span
                    layoutId="card-tab-highlight"
                    aria-hidden
                    className="absolute inset-0 rounded-lg sm:rounded-xl"
                    style={{
                      background: `linear-gradient(135deg, ${accent}4D 0%, ${accent}1A 100%)`,
                      boxShadow: `inset 0 0 0 1px ${accent}99, inset 0 1px 0 rgba(255,255,255,0.14), 0 10px 26px -12px ${accent}`,
                    }}
                    transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <CardThumb card={c} selected={selected} />
                {/* phones show the thumbnail only; the name stays for screen readers */}
                <span className="sr-only sm:not-sr-only sm:relative">{c.name}</span>
                {selected && autoplay && (
                  <span
                    aria-hidden
                    className="absolute bottom-[4px] left-2.5 right-2.5 h-[2px] overflow-hidden rounded-full bg-white/10 sm:bottom-[5px] sm:left-[2.375rem] sm:right-4"
                  >
                    <span
                      // Re-keyed per card so the bar restarts; its end advances the carousel.
                      key={active}
                      onAnimationEnd={() => select(active + 1, { manual: false })}
                      className="block size-full origin-left rounded-full"
                      style={{
                        background: accent,
                        animation: `fs-carousel-progress ${AUTOPLAY_MS}ms linear forwards`,
                        animationPlayState: paused ? "paused" : "running",
                      }}
                    />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="mt-3 sm:mt-5"
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          touchX.current = null;
          if (Math.abs(dx) > 60) select(active + (dx < 0 ? 1 : -1));
        }}
      >
        {cards.map((card, i) => (
          <CardPanel key={card.slug} card={card} campaign={campaign} hidden={i !== active} />
        ))}
      </div>

      <p className="mt-4 text-center text-sm text-white/55">
        Not sure which card?{" "}
        <WhatsAppLink
          href={WHATSAPP_URL}
          campaign={campaign}
          source="carousel"
          className="inline-flex items-center gap-1 font-medium text-white underline-offset-4 hover:underline"
        >
          <MessageCircle className="size-4" aria-hidden />
          Ask us on WhatsApp
        </WhatsAppLink>
      </p>
    </div>
  );
}

/** Tiny upright card in a tab: the official art, or the card's colours. */
function CardThumb({ card, selected }: { card: CampaignCard; selected: boolean }) {
  const img = card.image;
  return (
    <span
      aria-hidden
      className={`relative h-[34px] w-[22px] shrink-0 overflow-hidden rounded-[4px] sm:h-[26px] sm:w-[17px] shadow-[0_2px_6px_rgba(0,0,0,0.5)] ring-1 transition duration-300 ${
        selected ? "scale-110 ring-white/40" : "opacity-75 ring-white/15"
      }`}
      style={img ? undefined : { background: `linear-gradient(160deg, ${card.face.to}, ${card.face.from})` }}
    >
      {img && (
        <Image
          src={img.src}
          alt=""
          width={img.width}
          height={img.height}
          sizes="48px"
          className={
            img.width > img.height
              ? "absolute left-1/2 top-1/2 h-auto w-[158.6%] max-w-none -translate-x-1/2 -translate-y-1/2 rotate-90"
              : "size-full object-cover"
          }
        />
      )}
    </span>
  );
}

function CardPanel({
  card,
  campaign,
  hidden,
}: {
  card: CampaignCard;
  campaign: string;
  hidden: boolean;
}) {
  return (
    <article
      role="tabpanel"
      id={`panel-${card.anchor}`}
      aria-labelledby={`tab-${card.anchor}`}
      hidden={hidden}
      className="grid items-center gap-4 rounded-3xl border border-white/10 bg-white/[0.035] p-4 animate-in fade-in-0 duration-500 sm:gap-6 sm:p-7 md:grid-cols-[220px_1fr] md:gap-10 lg:grid-cols-[240px_1fr] lg:px-10"
    >
      {/* left: the card, upright */}
      <div className="group/card relative mx-auto hidden w-[200px] pb-4 md:block">
        <div
          aria-hidden
          className="absolute inset-[-18%] rounded-full opacity-25 blur-3xl"
          style={{ background: `radial-gradient(closest-side, ${card.face.accent}, transparent)` }}
        />
        {/* soft contact shadow on the "floor" */}
        <div
          aria-hidden
          className="absolute -bottom-1 left-1/2 h-5 w-[78%] -translate-x-1/2 rounded-[100%] bg-black/70 blur-lg transition-all duration-500 group-hover/card:w-[70%] group-hover/card:opacity-70"
        />
        <div className="relative -rotate-3 transition-transform duration-500 ease-out group-hover/card:-translate-y-1.5 group-hover/card:rotate-0">
          <PortraitCard card={card} front />
        </div>
      </div>

      {/* right: details */}
      <div className="min-w-0">
        <div className="flex items-start gap-3.5">
          {/* phones: a small card beside the name instead of the big one */}
          <div className="w-[80px] shrink-0 md:hidden">
            <PortraitCard card={card} front={false} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h3 className="font-satoshi text-lg font-semibold leading-tight text-white sm:text-xl">
                {card.name}
              </h3>
              {card.tag && (
                <span className="inline-flex items-center gap-1 rounded-full border border-white/15 px-2 py-0.5 text-[11px] font-medium text-white/70">
                  <MapPin className="size-3" aria-hidden />
                  {card.tag}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[13px] text-white/55">{card.bestFor}</p>
            {/* phones: headline benefit sits beside the card */}
            <div className="mt-2 md:hidden">
              <HeroBenefit card={card} compact />
            </div>
          </div>
        </div>

        <div className="mt-4 hidden md:block">
          <HeroBenefit card={card} />
        </div>

        <ul className="mt-3 grid gap-2 border-t border-white/10 pt-3 sm:mt-4 sm:grid-cols-3 sm:gap-5 sm:pt-4">
          {card.benefits.map((b) => (
            <li key={b.value} className="flex gap-2">
              <Check className="mt-0.5 size-3.5 shrink-0 text-white/45" aria-hidden />
              <p className="text-[13px] font-medium leading-snug text-white">
                {b.value}
                {b.qualifier && (
                  <span className="mt-0.5 hidden text-xs font-normal text-white/50 sm:block">{b.qualifier}</span>
                )}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex flex-col gap-3 sm:mt-5 sm:gap-4 xl:flex-row xl:items-center">
          <div className="grid min-w-0 flex-1 grid-cols-2 gap-3 rounded-2xl bg-white/[0.04] px-3.5 py-3 sm:flex sm:items-center sm:gap-5 sm:px-4">
            <div className="flex shrink-0 flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/45">Joining fee</p>
                <p className="whitespace-nowrap text-sm font-semibold text-white">{feeLabel(card.joiningFee)}</p>
              </div>
              <VoucherChip amount={card.voucher} refund={card.joiningFee > 0} />
            </div>
            <div className="min-w-0 flex-1 border-l border-white/10 pl-3 sm:pl-5">
              <p className="text-[10px] uppercase tracking-wider text-white/45">Annual fee</p>
              <p className="whitespace-nowrap text-sm font-semibold text-white">
                {feeLabel(card.annualFee)}
              </p>
              <p className="text-[11px] leading-snug text-white/50 sm:text-xs">{card.annualWaiver}</p>
            </div>
          </div>
          <div className="sm:w-56 xl:w-48 xl:shrink-0">
            <ApplyButton slug={card.slug} cardName={card.name} campaign={campaign} />
          </div>
        </div>

        <p className="mt-3 hidden text-xs leading-relaxed text-white/45 sm:block">
          {voucherLine(card)}.{" "}
          <span className="font-semibold text-white/60">Good to know: </span>
          {card.details.join(" ")}
        </p>
        <details className="group mt-3 text-xs text-white/45 sm:hidden">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1 font-semibold text-white/60 [&::-webkit-details-marker]:hidden">
            Good to know
            <ChevronDown className="size-3.5 transition group-open:rotate-180" aria-hidden />
          </summary>
          <p className="mt-1.5 leading-relaxed">{card.details.join(" ")}</p>
        </details>
      </div>
    </article>
  );
}

/**
 * Splits "5% cashback on online spends" (or "10 free airport lounge visits")
 * into the leading figure and the words after it.
 */
function splitFigure(text: string) {
  const m = text.match(/^(Up to )?(\d+(?:\.\d+)?%?)\s+(.+)$/);
  return m ? { prefix: m[1]?.trim(), figure: m[2], rest: m[3] } : null;
}

function HeroBenefit({ card, compact = false }: { card: CampaignCard; compact?: boolean }) {
  const hero = splitFigure(card.hero.value);
  if (compact) {
    return (
      <div>
        <p className="font-satoshi leading-tight text-white">
          {hero ? (
            <>
              {hero.prefix && <span className="mr-1 text-xs font-medium text-white/60">{hero.prefix}</span>}
              <span className="text-[1.75rem] font-semibold tracking-tight">{hero.figure}</span>{" "}
              <span className="text-sm font-medium">{hero.rest}</span>
            </>
          ) : (
            <span className="text-base font-semibold">{card.hero.value}</span>
          )}
        </p>
        {card.hero.qualifier && (
          <p className="mt-1 text-[11px] leading-snug text-white/50">{card.hero.qualifier}</p>
        )}
      </div>
    );
  }
  return (
    <div>
      {hero ? (
        <p className="font-satoshi leading-tight text-white">
          {hero.prefix && <span className="mr-1.5 text-sm font-medium text-white/60">{hero.prefix}</span>}
          <span className="text-[2rem] font-semibold tracking-tight sm:text-4xl lg:text-[2.75rem]">{hero.figure}</span>{" "}
          <span className="text-[15px] font-medium sm:text-lg">{hero.rest}</span>
        </p>
      ) : (
        <p className="font-satoshi text-xl font-semibold text-white">{card.hero.value}</p>
      )}
      {card.hero.qualifier && (
        <p className="mt-1 text-xs leading-relaxed text-white/50 sm:text-[13px]">{card.hero.qualifier}</p>
      )}
    </div>
  );
}

/** Ticket-shaped FiSense voucher — notched edges cut with radial masks. */
/** `refund`: the voucher pays back a joining fee ("₹999 back"); otherwise a flat festive voucher. */
function VoucherChip({ amount, refund }: { amount: number; refund: boolean }) {
  const mask =
    "radial-gradient(circle 5px at 0 50%, transparent 98%, #000) left / 51% 100% no-repeat, radial-gradient(circle 5px at 100% 50%, transparent 98%, #000) right / 51% 100% no-repeat";
  return (
    <div
      className="shrink-0 bg-primary-orange px-3 py-1.5 text-white shadow-[0_8px_24px_-10px_var(--primary-orange)]"
      style={{ borderRadius: 8, WebkitMask: mask, mask }}
    >
      <p className="font-satoshi text-sm font-bold leading-none">
        {inr(amount)} {refund ? "back" : "voucher"}
      </p>
      <p className="mt-0.5 text-[9px] font-medium uppercase leading-none tracking-wider text-white/85">
        FiSense voucher
      </p>
    </div>
  );
}
