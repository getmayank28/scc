"use client";

import { motion } from "motion/react";
import { LogIn, CreditCard, Trophy, type LucideIcon } from "lucide-react";
import { HOW_IT_WORKS } from "../data/merchants";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { fadeUp, inViewport, stagger, staticShow } from "../animations/variants";
import { Reveal } from "../animations/Reveal";

const STEP_ICONS: LucideIcon[] = [LogIn, CreditCard, Trophy];

/**
 * "How it works" — a 3-step timeline. A connector line draws in on scroll, and
 * each step rises in sequence. Reduced-motion renders everything in place.
 */
export function HowItWorks() {
  const reduced = usePrefersReducedMotion();

  return (
    <section className="relative bg-background-primary px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary-orange">
            How it works
          </p>
          <h2 className="mt-3 font-satoshi text-3xl font-medium text-white sm:text-4xl">
            Your best card in three steps
          </h2>
        </Reveal>

        <div className="relative mt-14">
          {/* connector line (desktop) */}
          <div className="absolute left-0 right-0 top-7 hidden h-px bg-white/10 md:block">
            <motion.div
              className="h-full origin-left bg-gradient-to-r from-primary-orange to-tertiary-orange"
              initial={reduced ? { scaleX: 1 } : { scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={inViewport}
              transition={{ duration: 1.1, ease: "easeInOut" }}
            />
          </div>

          <Reveal
            as="container"
            containerVariants={reduced ? staticShow : stagger(0.18)}
            className="grid gap-10 md:grid-cols-3 md:gap-6"
          >
            {HOW_IT_WORKS.map((step, i) => {
              const Icon = STEP_ICONS[i];
              return (
                <motion.div
                  key={step.title}
                  variants={reduced ? staticShow : fadeUp}
                  className="relative flex flex-col items-center text-center md:items-start md:text-left"
                >
                  <div className="relative z-10 flex size-14 items-center justify-center rounded-2xl border border-primary-orange/30 bg-background-primary shadow-lg shadow-black/40">
                    <Icon className="size-6 text-primary-orange" />
                    <span className="absolute -right-1.5 -top-1.5 flex size-6 items-center justify-center rounded-full bg-primary-orange text-xs font-bold text-white">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="mt-5 font-satoshi text-xl font-medium text-white">
                    {step.title}
                  </h3>
                  <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/60">
                    {step.body}
                  </p>
                </motion.div>
              );
            })}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
