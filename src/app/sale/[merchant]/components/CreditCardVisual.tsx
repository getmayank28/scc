"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Sparkles, Wifi } from "lucide-react";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

interface CardFace {
  name: string;
  last4: string;
  network: string;
  gradient: string;
}

/** Non-branded card faces cycled through the hero stack. */
const CARDS: CardFace[] = [
  {
    name: "Axis Bank",
    last4: "7042",
    network: "VISA",
    // Burgundy → rose, with a warm gold highlight corner.
    gradient:
      "radial-gradient(120% 120% at 85% 15%, #F59E0B 0%, transparent 42%), linear-gradient(135deg, #4A0E2E 0%, #8B1E4B 45%, #B32B62 75%, #E24A7E 100%)",
  },
  {
    name: "HDFC Bank",
    last4: "3318",
    network: "Mastercard",
    // Deep navy → royal blue with an electric-blue sheen.
    gradient:
      "radial-gradient(120% 120% at 85% 15%, #60A5FA 0%, transparent 45%), linear-gradient(135deg, #0A1B3D 0%, #14307A 45%, #2149B8 78%, #3B6FE8 100%)",
  },
  {
    name: "AMEX",
    last4: "1005",
    network: "AMEX",
    // Emerald → teal with a bright aqua highlight.
    gradient:
      "radial-gradient(120% 120% at 85% 15%, #5EEAD4 0%, transparent 44%), linear-gradient(135deg, #04302B 0%, #0B5B4E 45%, #10897A 78%, #1FB8A3 100%)",
  },
  {
    name: "ICICI Bank",
    last4: "8890",
    network: "RuPay",
    // Deep indigo → violet with a luminous purple corner.
    gradient:
      "radial-gradient(120% 120% at 85% 15%, #C084FC 0%, transparent 44%), linear-gradient(135deg, #1A0E3D 0%, #3D2288 45%, #6D34D6 78%, #9457F0 100%)",
  },
];

/**
 * Stack geometry indexed by depth — 0 is the front (top) card. Horizontal offset
 * is kept small and balanced around the front card so the stack reads as centred;
 * depth is carried mostly by upward offset, scale and rotation.
 */
const LAYERS = [
  { y: 0, x: 0, rotate: 0, scale: 1, opacity: 1 },
  { y: -14, x: 8, rotate: 4, scale: 0.95, opacity: 0.9 },
  { y: -26, x: -8, rotate: -8, scale: 0.9, opacity: 0.75 },
  { y: -36, x: 0, rotate: 0, scale: 0.85, opacity: 0.58 },
];

/**
 * Hero focal visual: a looping stack of premium, non-branded credit cards. Every
 * few seconds the back-most card glides over the top and the rest shift one step
 * back, so the stack endlessly cycles — teasing "we check every card you own." The
 * top card catches a glare sweep and wears the "best for this sale" badge.
 * Cycling and motion freeze under reduced-motion (cards sit as a static stack).
 */
export function CreditCardVisual() {
  const reduced = usePrefersReducedMotion();
  const [front, setFront] = useState(0);
  const count = CARDS.length;

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setFront((f) => (f + 1) % count), 2600);
    return () => clearInterval(id);
  }, [reduced, count]);

  return (
    <div className="relative mx-auto aspect-[1.9/1] w-full max-w-sm [perspective:1200px]">
      {CARDS.map((card, i) => {
        // Distance from the front of the stack. As `front` advances each second
        // every card slides one step back and the wrapping card pops to depth 0.
        const depth = (front - i + count) % count;
        const layer = LAYERS[Math.min(depth, LAYERS.length - 1)];
        const isFront = depth === 0;

        return (
          <motion.div
            key={card.name}
            className="absolute inset-0 h-full w-full overflow-hidden rounded-2xl border border-white/15 shadow-2xl shadow-black/50"
            style={{ background: card.gradient, zIndex: count - depth }}
            initial={false}
            animate={{
              x: layer.x,
              y: layer.y,
              rotateZ: layer.rotate,
              scale: layer.scale,
              opacity: layer.opacity,
            }}
            transition={{ type: "spring", stiffness: 90, damping: 20, mass: 1.1 }}
          >
            {/* glare sweep — front card only */}
            {isFront && !reduced && (
              <motion.div
                aria-hidden
                className="absolute inset-0 bg-[linear-gradient(115deg,transparent_30%,rgba(255,255,255,0.18)_45%,transparent_60%)]"
                initial={{ x: "-100%" }}
                animate={{ x: ["-100%", "100%"] }}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  repeatDelay: 2.5,
                  ease: "easeInOut",
                }}
              />
            )}

            {/* soft light-catch that flatters every card colour */}
            <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/20 blur-2xl" />
            {/* subtle inner sheen from the top-left */}
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(150deg,rgba(255,255,255,0.14)_0%,transparent_35%)]" />

            <div className="relative flex h-full flex-col justify-between p-5">
              <div className="flex items-start justify-between">
                <span className="font-satoshi text-lg font-medium text-white">
                  {card.name}
                </span>
                <Wifi className="size-5 rotate-90 text-white/70" />
              </div>

              {/* chip */}
              <div className="h-7 w-10 rounded-md bg-gradient-to-br from-amber-200 to-amber-500/80 shadow-inner" />

              <div className="space-y-3">
                <p className="font-mono text-sm tracking-[0.2em] text-white/80">
                  ••••&nbsp;&nbsp;••••&nbsp;&nbsp;••••&nbsp;&nbsp;{card.last4}
                </p>
                <div className="flex items-center justify-between">
                  {isFront ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary-orange/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                      <Sparkles className="size-3" />
                      Best for this sale
                    </span>
                  ) : (
                    <span />
                  )}
                  <span className="text-xs text-white/50">{card.network}</span>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
