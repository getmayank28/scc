"use client";

import { useEffect, useState } from "react";
import { ArrowDown } from "lucide-react";
import { TrackedPickCard } from "./Tracked";

/**
 * Phones only: a "Pick my card" bar pinned to the bottom once the hero button
 * has scrolled away, hidden again while the cards are on screen (where it would
 * just point at what the visitor is already looking at).
 */
export function StickyPickCard() {
  const [heroGone, setHeroGone] = useState(false);
  const [cardsVisible, setCardsVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("hero-cta");
    const cards = document.getElementById("cards");
    if (!hero || !cards) return;
    const heroIo = new IntersectionObserver(([e]) => setHeroGone(!e.isIntersecting && e.boundingClientRect.top < 0));
    const cardsIo = new IntersectionObserver(([e]) => setCardsVisible(e.isIntersecting), { threshold: 0.15 });
    heroIo.observe(hero);
    cardsIo.observe(cards);
    return () => {
      heroIo.disconnect();
      cardsIo.disconnect();
    };
  }, []);

  const show = heroGone && !cardsVisible;

  return (
    <div
      // Hidden = out of the tab order and the accessibility tree too.
      inert={!show}
      className={`fixed inset-x-0 bottom-0 z-50 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 transition duration-300 sm:hidden ${
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"
      }`}
      style={{ background: "linear-gradient(to top, var(--background-primary, #111) 60%, transparent)" }}
    >
      <TrackedPickCard
        source="sticky"
        className="flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#FF8A3D_0%,var(--primary-orange)_45%,#E5391B_100%)] font-satoshi text-base font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_14px_34px_-12px_var(--primary-orange)] ring-1 ring-white/15"
      >
        Pick my card
        <ArrowDown className="size-[18px]" strokeWidth={2.5} aria-hidden />
      </TrackedPickCard>
    </div>
  );
}
