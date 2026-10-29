"use client";

import Image from "next/image";
import { motion } from "motion/react";
import {
  ArrowDown,
  Landmark,
  MessageCircle,
  PhoneOff,
  Gift,
  Plane,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Bike,
  Gem,
  UtensilsCrossed,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { usePrefersReducedMotion } from "@/app/sale/[merchant]/hooks/usePrefersReducedMotion";
import { inr, type CampaignCard, type TrustPoint } from "../_data/festive";

/**
 * Layered drop shadow, like a real card lifted off the page: a tight contact
 * shadow, a mid blur and a long soft falloff. The front card adds a faint glow
 * in its own colour instead of a heavy coloured halo.
 */
/**
 * A real card's corner is ~6% of its width. As horizontal/vertical percentages of
 * an upright 0.63-ratio frame, the corners stay true at any rendered size.
 */
const CARD_RADIUS = "6% / 3.8%";

function cardShadow(accent: string, front: boolean) {
  const base =
    "inset 0 1px 0 rgba(255,255,255,0.22), 0 1px 2px rgba(0,0,0,0.35), 0 10px 20px -8px rgba(0,0,0,0.55), 0 28px 56px -18px rgba(0,0,0,0.7)";
  return front ? `${base}, 0 40px 90px -35px ${accent}B3` : base;
}

const TRUST_LOOK: Record<TrustPoint["icon"], { icon: LucideIcon; tile: string }> = {
  "no-calls": { icon: PhoneOff, tile: "bg-emerald-400/12 text-emerald-300 ring-emerald-400/25" },
  bank: { icon: Landmark, tile: "bg-sky-400/12 text-sky-300 ring-sky-400/25" },
  whatsapp: { icon: MessageCircle, tile: "bg-[#25D366]/15 text-[#25D366] ring-[#25D366]/30" },
};

/** Hero-only presentation per card: short title, glyph, and fan position. */
const HERO_LOOK: Record<string, { title: string; icon: LucideIcon }> = {
  "sbi-cashback": { title: "Cashback SBI", icon: ShoppingCart },
  "tata-neu-plus-hdfc": { title: "Tata Neu Plus", icon: Gem },
  "flipkart-axis": { title: "Flipkart Axis", icon: ShoppingBag },
  "hsbc-live-plus": { title: "HSBC Live+", icon: UtensilsCrossed },
  "swiggy-ornge-hdfc": { title: "Swiggy ORNGE", icon: Bike },
};

/** Left-to-right fan order: the middle card is raised to the front. */
// Tata Neu leads: upright, vivid art. Flipkart Axis (black) sits back where it
// doesn't sink into the dark page.
const FAN_ORDER = [
  "sbi-cashback",
  "flipkart-axis",
  "tata-neu-plus-hdfc",
  "hsbc-live-plus",
  "swiggy-ornge-hdfc",
];

export function CampaignHero({
  headline,
  eyebrow,
  trustPoints,
  cards,
}: {
  headline: string;
  eyebrow: string;
  trustPoints: readonly TrustPoint[];
  cards: CampaignCard[];
}) {
  const vouchers = cards.map((c) => c.voucher);
  const min = Math.min(...vouchers);
  const max = Math.max(...vouchers);
  // "Get your joining fee back / on 5 top credit cards": break before "on" on
  // wider screens and accent the card count, as in the reference layout.
  const m = headline.match(/^(.*?)\s+(on\s+)(\d+ top credit cards)$/);

  return (
    <section className="relative overflow-hidden pt-28 sm:pt-32">
      <Backdrop />
      <FloatingTiles />

      <div className="relative z-10 mx-auto max-w-4xl px-5 text-center sm:px-8">
        <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-1.5 text-sm font-medium text-white/85 backdrop-blur">
          <Zap className="size-4 fill-amber-400 text-amber-400" aria-hidden />
          {eyebrow}
        </p>
        <h1 className="mx-auto mt-5 max-w-4xl text-balance font-satoshi text-[2rem] font-bold leading-[1.1] tracking-tight text-white sm:mt-6 sm:text-6xl sm:leading-[1.05] lg:text-[4.5rem]">
          {m ? (
            <>
              {m[1]} <br className="hidden sm:block" />
              {m[2]}
              <span className="bg-gradient-to-r from-amber-300 via-primary-orange to-rose-400 bg-clip-text text-transparent">
                {m[3]}
              </span>
            </>
          ) : (
            headline
          )}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/60 sm:mt-5 sm:text-lg">
          Apply through FiSense and get a cashback voucher of {inr(min)} to {inr(max)}, the same
          as your card&apos;s joining fee.
        </p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:mt-8 sm:flex-row">
          <a
            href="#cards"
            className="group/cta relative inline-flex h-[54px] items-center gap-4 overflow-hidden rounded-full bg-[linear-gradient(135deg,#FF8A3D_0%,var(--primary-orange)_45%,#E5391B_100%)] pl-7 pr-1.5 font-satoshi text-base font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_14px_34px_-12px_var(--primary-orange)] ring-1 ring-white/15 transition duration-300 hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_20px_44px_-12px_var(--primary-orange)] active:translate-y-0 active:scale-[0.98]"
          >
            {/* light sweep on hover */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 ease-out group-hover/cta:translate-x-[520%]"
            />
            <span className="relative">See the {cards.length} cards</span>
            <span className="relative flex size-[42px] items-center justify-center rounded-full bg-white text-primary-orange shadow-[0_2px_8px_rgba(0,0,0,0.2)] transition-transform duration-300 group-hover/cta:translate-y-0.5">
              <ArrowDown className="size-[18px]" strokeWidth={2.5} aria-hidden />
            </span>
          </a>
          <a
            href="#how-it-works"
            className="group/how hidden h-[54px] sm:inline-flex items-center gap-2.5 rounded-full border border-white/12 bg-white/[0.05] pl-2 pr-5 text-[15px] font-medium text-white/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.09] hover:text-white"
          >
            <span className="flex size-[38px] items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15 transition group-hover/how:bg-white/15">
              <Gift className="size-[17px] text-amber-300" aria-hidden />
            </span>
            How the cashback works
          </a>
        </div>
      </div>

      <CardFan cards={cards} />

      <div className="relative z-20 -mt-6 px-5 pb-2 sm:-mt-10 sm:px-8">
        <ul className="mx-auto grid max-w-4xl grid-cols-3 divide-x divide-white/10 rounded-2xl border border-white/10 bg-background-primary/85 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_60px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:rounded-3xl sm:p-5">
          {trustPoints.map((point) => {
            const { icon: Icon, tile } = TRUST_LOOK[point.icon];
            return (
              <li
                key={point.icon}
                className="flex min-w-0 flex-col items-center gap-1.5 px-1 text-center sm:flex-row sm:gap-3 sm:px-5 sm:text-left sm:first:pl-1 sm:last:pr-1"
              >
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-lg ring-1 sm:size-10 sm:rounded-xl ${tile}`}
                >
                  <Icon className="size-3.5 sm:size-[18px]" strokeWidth={2.2} aria-hidden />
                </span>
                <p className="text-[11px] font-medium leading-tight text-white/85 sm:text-sm sm:leading-snug">
                  {/* phones: short label; full sentence for screen readers and wider screens */}
                  <span aria-hidden className="block whitespace-nowrap text-[clamp(9.5px,2.9vw,12px)] sm:hidden">
                    {point.short}
                  </span>
                  <span className="sr-only sm:not-sr-only">{point.text}</span>
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/** Faint grid fading out from the top, plus a glow behind the front card. */
function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_30%,black,transparent)]" />
      <div className="absolute left-1/2 top-[58%] h-[420px] w-[620px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklch,#3B6FE8_45%,transparent),transparent)] blur-2xl" />
      <div className="absolute left-1/2 top-0 h-[320px] w-[760px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--primary-orange)_18%,transparent),transparent)] blur-2xl" />
    </div>
  );
}

const TILES: {
  icon: LucideIcon;
  gradient: string;
  className: string;
  rotate: number;
  delay: number;
}[] = [
  {
    icon: Gift,
    gradient: "from-violet-400 to-indigo-600",
    className: "left-[7%] top-[22%]",
    rotate: -10,
    delay: 0,
  },
  {
    icon: Plane,
    gradient: "from-sky-300 to-blue-600",
    className: "right-[8%] top-[16%]",
    rotate: 8,
    delay: 0.6,
  },
  {
    icon: ShoppingBag,
    gradient: "from-fuchsia-400 to-purple-600",
    className: "right-[12%] top-[40%]",
    rotate: -6,
    delay: 1.2,
  },
  {
    icon: Sparkles,
    gradient: "from-amber-300 to-orange-500",
    className: "left-[13%] top-[46%]",
    rotate: 6,
    delay: 1.8,
  },
];

/** Glassy icon tiles drifting around the headline (desktop only). */
function FloatingTiles() {
  const reduced = usePrefersReducedMotion();
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block">
      {TILES.map(({ icon: Icon, gradient, className, rotate, delay }) => (
        <motion.div
          key={className}
          className={`absolute ${className}`}
          style={{ rotate }}
          animate={reduced ? undefined : { y: [0, -10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay }}
        >
          <div className="rounded-[22px] border border-white/10 bg-white/[0.05] p-3 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.7)] backdrop-blur-md">
            <div
              className={`flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} shadow-[inset_0_1px_0_rgba(255,255,255,0.45),inset_0_-6px_12px_rgba(0,0,0,0.25)]`}
            >
              <Icon className="size-6 text-white drop-shadow" strokeWidth={2.2} />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/**
 * The five cards fanned out, front card in the middle. Positions are in % of a
 * card's own width, so the fan scales with the viewport; edge cards crop on
 * phones, as in the reference. Each card jumps to its tile below.
 */
function CardFan({ cards }: { cards: CampaignCard[] }) {
  const reduced = usePrefersReducedMotion();
  const ordered = FAN_ORDER.map((a) => cards.find((c) => c.anchor === a)).filter(
    (c): c is CampaignCard => Boolean(c),
  );
  const mid = (ordered.length - 1) / 2;

  return (
    <div className="relative mx-auto mt-12 h-[clamp(250px,58vw,400px)] max-w-6xl overflow-hidden [--card-w:clamp(132px,24vw,232px)] sm:mt-16">
      {ordered.map((card, i) => {
        const offset = i - mid;
        const depth = Math.abs(offset);
        const final = {
          x: `${offset * 78}%`,
          y: depth * 7 + "%",
          rotate: offset * 7,
          scale: 1 - depth * 0.04,
          opacity: 1,
        };
        return (
          <motion.a
            key={card.slug}
            href={`#${card.anchor}`}
            aria-label={`${card.name}: ${card.hero.value}`}
            className="group absolute left-1/2 top-0 w-[var(--card-w)] origin-bottom"
            style={{ zIndex: 10 - depth, marginLeft: "calc(var(--card-w) / -2)" }}
            initial={reduced ? final : { x: "0%", y: "12%", rotate: 0, scale: 0.9, opacity: 0 }}
            animate={final}
            transition={{ type: "spring", stiffness: 120, damping: 18, delay: 0.15 + depth * 0.08 }}
          >
            <div className="transition-transform duration-300 group-hover:-translate-y-4">
              <PortraitCard card={card} front={depth === 0} />
            </div>
          </motion.a>
        );
      })}
      {/* fade the cropped bottom edge into the page */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-24 bg-gradient-to-t from-background-primary to-transparent"
      />
    </div>
  );
}

/**
 * Upright card: the bank's art when we have it, otherwise a face drawn in the
 * card's own colours, styled after the reference art. Text
 * is sized in container units so it scales with the card wherever it's used.
 */
export function PortraitCard({ card, front }: { card: CampaignCard; front: boolean }) {
  if (card.image) return <OfficialCard card={card} image={card.image} front={front} />;
  const look = HERO_LOOK[card.anchor];
  const Icon = look?.icon ?? Sparkles;
  const { from, to, accent } = card.face;
  const tagline = card.bestFor.replace(/^Best for /, "");

  return (
    <div
      className="@container relative aspect-[0.63] overflow-hidden text-white ring-1 ring-white/10"
      style={{
        borderRadius: CARD_RADIUS,
        background: `linear-gradient(160deg, ${to} 0%, ${from} 85%)`,
        boxShadow: cardShadow(accent, front),
      }}
    >
      {/* soft orbs + sheen for depth */}
      <div
        className="absolute -bottom-[18%] -right-[22%] size-[95%] rounded-full opacity-70 blur-[2px]"
        style={{ background: `radial-gradient(circle at 35% 30%, ${accent}, transparent 68%)` }}
      />
      <div
        className="absolute -bottom-[30%] -left-[25%] size-[80%] rounded-full opacity-40"
        style={{ background: `radial-gradient(circle at 60% 40%, ${accent}, transparent 65%)` }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.18)_0%,transparent_35%)]" />

      <div className="relative flex h-full flex-col p-[9%]">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-satoshi text-[8.5cqw] font-bold leading-tight">
              {look?.title ?? card.name}
            </p>
            <p className="mt-0.5 truncate text-[5.2cqw] text-white/75 first-letter:uppercase">
              {tagline}
            </p>
          </div>
          <span className="flex size-[13.5cqw] shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur">
            <Icon className="size-[55%]" aria-hidden />
          </span>
        </div>

        <span
          aria-hidden
          className="mt-[12%] block aspect-[1.3] w-[22%] rounded-[5px] bg-gradient-to-br from-amber-100 via-amber-300 to-amber-500 shadow-inner"
        />

        {/* hero glyph */}
        <Icon
          aria-hidden
          strokeWidth={1.4}
          className="absolute bottom-[22%] right-[8%] size-[46%] text-white/85 drop-shadow-[0_10px_20px_rgba(0,0,0,0.35)]"
        />

        <div className="mt-auto flex items-end justify-between gap-2">
          <div>
            <p className="font-satoshi text-[8.5cqw] font-black italic leading-none">
              {card.network === "VISA" ? "VISA" : card.network}
            </p>
            <p className="mt-1 text-[4.8cqw] text-white/70">{card.bank}</p>
          </div>
          <span className="rounded-full bg-white/20 px-[3.5cqw] py-[1cqw] text-[4.8cqw] font-semibold backdrop-blur">
            {inr(card.voucher)} back
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * The bank's own card art at the same upright size as the drawn faces. Landscape
 * art (most bank art) is rotated a quarter turn to stand upright.
 */
function OfficialCard({
  card,
  image,
  front,
}: {
  card: CampaignCard;
  image: NonNullable<CampaignCard["image"]>;
  front: boolean;
}) {
  const landscape = image.width > image.height;
  return (
    <div
      className="relative aspect-[0.63] overflow-hidden ring-1 ring-white/10"
      style={{ borderRadius: CARD_RADIUS, boxShadow: cardShadow(card.face.accent, front) }}
    >
      <Image
        src={image.src}
        alt={`${card.name} credit card`}
        width={image.width}
        height={image.height}
        sizes="(min-width: 768px) 240px, 160px"
        className={
          landscape
            ? // Card ratio 1.586: the rotated art's width spans the frame's height.
              "absolute left-1/2 top-1/2 h-auto w-[158.6%] max-w-none -translate-x-1/2 -translate-y-1/2 rotate-90"
            : "size-full object-cover"
        }
      />
      {/* glossy sheen catching the light from the top left */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0.05)_30%,transparent_55%)]"
      />
    </div>
  );
}
