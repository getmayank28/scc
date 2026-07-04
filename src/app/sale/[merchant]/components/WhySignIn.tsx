"use client";

import { motion } from "motion/react";
import {
  BadgeCheck,
  Clock,
  CreditCard,
  PiggyBank,
  Receipt,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { SIGN_IN_BENEFITS } from "../data/merchants";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { fadeUp, stagger, staticShow } from "../animations/variants";
import { Reveal } from "../animations/Reveal";

const ICONS: LucideIcon[] = [
  BadgeCheck,
  PiggyBank,
  CreditCard,
  TrendingUp,
  Receipt,
  Clock,
];

/** Benefit grid — the consolidated answer to "why should I sign in?". */
export function WhySignIn() {
  const reduced = usePrefersReducedMotion();

  return (
    <section className="relative bg-background-primary px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary-orange">
            Why sign in
          </p>
          <h2 className="mt-3 font-satoshi text-3xl font-medium text-white sm:text-4xl">
            Everything working in your favour
          </h2>
        </Reveal>

        <Reveal
          as="container"
          containerVariants={reduced ? staticShow : stagger(0.07)}
          className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {SIGN_IN_BENEFITS.map((benefit, i) => {
            const Icon = ICONS[i];
            return (
              <motion.div
                key={benefit.title}
                variants={reduced ? staticShow : fadeUp}
                whileHover={reduced ? undefined : { y: -5 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-primary-orange/30 hover:bg-white/[0.05]"
              >
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary-orange/10 text-primary-orange transition-colors group-hover:bg-primary-orange/20">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-4 font-satoshi text-lg font-medium text-white">
                  {benefit.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/60">
                  {benefit.body}
                </p>
              </motion.div>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}
