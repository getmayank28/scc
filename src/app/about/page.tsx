"use client";

import Image from "next/image";
import { motion, type Variants } from "motion/react";
import {
  ArrowRight,
  ArrowUpRight,
  Mail,
  Lock,
  Tag,
  Trophy,
  ArrowLeftRight,
  TrendingDown,
  FileText,
  ShoppingCart,
  Plane,
  Fuel,
  Receipt,
  Search,
  Sparkles,
  Target,
  Wallet,
  GraduationCap,
  Briefcase,
  Clock,
} from "lucide-react";

import { Header } from "@/components/Header";
import { Footer } from "@/landing/Footer";

const ease = [0.21, 0.47, 0.32, 0.98] as const;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease },
  },
};

const stagger: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease, delay }}
    >
      {children}
    </motion.div>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-satoshi text-[12px] tracking-[3px] uppercase text-white/50">
      {children}
    </span>
  );
}

function Divider() {
  return (
    <div
      aria-hidden
      className="mx-auto h-px w-full max-w-7xl bg-gradient-to-r from-transparent via-white/10 to-transparent"
    />
  );
}

/* -------------------------------------------------------------------------- */
/*  Section 1 — Hero                                                          */
/* -------------------------------------------------------------------------- */

function Hero() {
  return (
    <section className="relative overflow-hidden pt-[180px] pb-[140px] max-md:pt-[120px] max-md:pb-[80px]">
      {/* Soft fade grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 30%, black 30%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 50% 30%, black 30%, transparent 80%)",
        }}
      />

      {/* Animated orange glow */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.4, ease }}
        className="pointer-events-none absolute left-1/2 top-[80px] -translate-x-1/2"
      >
        <div className="h-[420px] w-[820px] max-md:w-[420px] max-md:h-[280px] rounded-full bg-[#F35A13]/20 blur-[120px]" />
      </motion.div>

      <div className="relative z-10 mx-auto max-w-[1100px] px-6 text-center">
        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.9, ease, delay: 0.05 }}
          className="mx-auto mt-6 max-w-[860px] font-butlerpro text-white text-[76px] leading-[1.05] tracking-[-3px] max-md:text-[44px] max-md:leading-[1.08] max-md:tracking-[-1px]"
        >
          The rewards <br className="hidden max-md:flex"/> are real.
          <br className="max-md:hidden" />
           {" "}The complexity is{" "}
          <span className="text-[#F35A13] italic">deliberate.</span>
        </motion.h1>

        <Reveal delay={0.15}>
          <p className="mx-auto mt-8 max-w-[680px] font-satoshi text-[18px] leading-[1.6] text-white/70 max-md:text-[15px] max-md:mt-6">
            Credit card rewards aren&apos;t confusing by accident. FiSense helps
            consumers reclaim value hidden behind rules, caps, exclusions, and
            redemption complexity.
          </p>
        </Reveal>

        <Reveal delay={0.25}>
          <div className="mt-12 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-5 py-2.5 backdrop-blur-sm max-md:mt-8">
            <span className="h-1.5 w-1.5 rounded-full bg-[#F35A13] shadow-[0_0_12px_#F35A13]" />
            <span className="font-satoshi text-[13px] tracking-[0.2px] text-white/70">
              Built by industry insiders. Designed for everyday cardholders.
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section 2 — The Hidden System                                             */
/* -------------------------------------------------------------------------- */

const HIDDEN_ITEMS = [
  { icon: Lock, title: "Reward Caps", body: "Quietly throttled the moment they matter most." },
  { icon: Tag, title: "Merchant Restrictions", body: "Where you swipe decides what you earn." },
  { icon: Trophy, title: "Milestone Thresholds", body: "Tiers engineered to stay just out of reach." },
  { icon: ArrowLeftRight, title: "Transfer Ratios", body: "Points lose value the moment they move." },
  { icon: TrendingDown, title: "Redemption Devaluations", body: "Today's reward, tomorrow's discount." },
  { icon: FileText, title: "Hidden Fine Print", body: "The rules nobody reads — until they bind." },
];

function HiddenSystem() {
  return (
    <section className="relative py-[140px] max-md:py-[80px]">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-12 gap-12 max-lg:grid-cols-1 max-lg:gap-8">
          <div className="col-span-5 max-lg:col-span-1">
            <Reveal>
              <SectionEyebrow>The Hidden System</SectionEyebrow>
            </Reveal>
            <Reveal delay={0.08}>
              <h2 className="mt-6 font-butlerpro text-[54px] leading-[1.08] tracking-[-2px] text-white max-md:text-[36px] max-md:tracking-[-1px]">
                Why rewards feel complicated
              </h2>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="mt-6 max-w-[420px] font-satoshi text-[16px] leading-[1.65] text-white/60">
                The structure isn&apos;t accidental. Six mechanisms,
                working in concert, decide who keeps what they earn.
              </p>
            </Reveal>
          </div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="col-span-7 grid grid-cols-2 gap-4 max-md:grid-cols-1 max-lg:col-span-1"
          >
            {HIDDEN_ITEMS.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  variants={fadeUp}
                  className={`group relative rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-sm transition-all duration-500 hover:border-[#F35A13]/40 hover:bg-white/[0.04] hover:shadow-[0_0_48px_-12px_rgba(243,90,19,0.35)] ${
                    i % 2 === 1 ? "md:translate-y-6" : ""
                  }`}
                >
                  <div className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-white/80 transition-colors duration-500 group-hover:border-[#F35A13]/50 group-hover:text-[#F35A13]">
                    <Icon size={18} strokeWidth={1.5} />
                  </div>
                  <h3 className="font-satoshi text-[16px] font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 font-satoshi text-[13.5px] leading-[1.6] text-white/55">
                    {item.body}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Pull quote */}
        <Reveal delay={0.1}>
          <div className="mt-[120px] max-md:mt-[80px] mx-auto max-w-[1000px] text-center">
            <div className="mx-auto mb-8 h-px w-16 bg-[#F35A13]/60" />
            <p className="font-butlerpro max-md:text-left text-[44px] leading-[1.15] tracking-[-1.5px] text-white max-md:text-[26px] max-md:leading-[1.2] max-md:tracking-[-0.5px]">
              The system rewards the{" "}
              <span className="text-[#F35A13]">5%</span> who understand it
              <br className="max-md:hidden" /> and quietly profits from the{" "}
              <span className="text-[#F35A13]">95%</span> who don&apos;t.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section 3 — Why FiSense Exists                                            */
/* -------------------------------------------------------------------------- */

const FLOW_STEPS = [
  { icon: Wallet, label: "Spend" },
  { icon: Search, label: "Analyze" },
  { icon: Target, label: "Recommend" },
  { icon: Sparkles, label: "Maximize" },
];

function WhyFiSenseExists() {
  return (
    <section className="relative border-t border-white/[0.06] py-[140px] max-md:py-[80px]">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-12 items-center gap-16 max-lg:grid-cols-1 max-lg:gap-12">
          <div className="col-span-6 max-lg:col-span-1">
            <Reveal>
              <SectionEyebrow>Our Reason</SectionEyebrow>
            </Reveal>
            <Reveal delay={0.08}>
              <h2 className="mt-6 font-butlerpro text-[60px] leading-[1.05] tracking-[-2.5px] text-white max-md:text-[38px] max-md:tracking-[-1px]">
                FiSense exists to <br className="max-md:hidden"/>change that ratio.
              </h2>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="mt-8 max-w-[480px] font-satoshi text-[17px] leading-[1.7] text-white/65 max-md:text-[15px]">
                Credit card optimisation shouldn&apos;t require spreadsheets,
                forums, and hours of research. We turn rules into recommendations,
                and recommendations into rewards.
              </p>
            </Reveal>
          </div>

          {/* Flow diagram */}
          <Reveal delay={0.12} className="col-span-6 max-lg:col-span-1">
            <div className="relative rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent p-10 max-md:p-6">
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-px rounded-3xl opacity-50"
                style={{
                  background:
                    "radial-gradient(circle at 50% 0%, rgba(243,90,19,0.18), transparent 60%)",
                }}
              />
              <div className="relative flex flex-col gap-4">
                {FLOW_STEPS.map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.label}>
                      <motion.div
                        initial={{ opacity: 0, x: -12 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 + i * 0.12, duration: 0.6, ease }}
                        className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 backdrop-blur-sm"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-md border border-[#F35A13]/30 bg-[#F35A13]/10 text-[#F35A13]">
                          <Icon size={16} strokeWidth={1.6} />
                        </div>
                        <span className="font-satoshi text-[15px] font-medium text-white">
                          {step.label}
                        </span>
                        <span className="ml-auto font-satoshi text-[11px] tracking-[2px] uppercase text-white/30">
                          0{i + 1}
                        </span>
                      </motion.div>
                      {i < FLOW_STEPS.length - 1 && (
                        <motion.div
                          initial={{ scaleY: 0 }}
                          whileInView={{ scaleY: 1 }}
                          viewport={{ once: true }}
                          transition={{
                            delay: 0.18 + i * 0.12,
                            duration: 0.4,
                            ease,
                          }}
                          aria-hidden
                          className="ml-7 my-1 h-4 w-px origin-top bg-gradient-to-b from-[#F35A13]/60 to-transparent"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section 4 — What We Do                                                    */
/* -------------------------------------------------------------------------- */

const FEATURES = [
  {
    title: "Choose Better",
    body: "Choose cards based on actual spending behavior — not marketing claims.",
  },
  {
    title: "Spend Smarter",
    body: "Get transaction-level recommendations the moment a swipe matters.",
  },
  {
    title: "Redeem Better",
    body: "Understand redemption value clearly, before points lose their worth.",
  },
  {
    title: "Avoid Leakage",
    body: "Stop losing rewards to caps, exclusions, and hidden fine print.",
  },
];

function WhatWeDo() {
  return (
    <section className="relative border-t border-white/[0.06] py-[140px] max-md:py-[80px]">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal className="text-center max-md:text-left">
          <SectionEyebrow>What We Do</SectionEyebrow>
        </Reveal>
        <Reveal delay={0.08}>
          <h2 className="mx-auto mt-6 max-md:text-left max-w-[760px] text-center font-butlerpro text-[56px] leading-[1.06] tracking-[-2px] text-white max-md:text-[36px] max-md:tracking-[-1px]">
            One platform. Every card.
            <br className="max-md:hidden"/>{" "}
            <span className="text-[#F35A13] italic">Maximum value.</span>
          </h2>
        </Reveal>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-20 grid grid-cols-2 gap-5 max-md:mt-12 max-md:grid-cols-1"
        >
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent p-8 transition-all duration-500 hover:-translate-y-1 hover:border-[#F35A13]/35 hover:shadow-[0_20px_60px_-20px_rgba(243,90,19,0.3)] max-md:p-6"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[#F35A13]/10 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <span className="font-satoshi text-[11px] tracking-[3px] uppercase text-white/40">
                    0{i + 1}
                  </span>
                  <ArrowUpRight
                    size={18}
                    className="text-white/30 transition-all duration-500 group-hover:text-[#F35A13] group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </div>
                <h3 className="mt-10 font-butlerpro text-[30px] leading-[1.15] tracking-[-1px] text-white max-md:text-[24px]">
                  {f.title}
                </h3>
                <p className="mt-3 max-w-[360px] font-satoshi text-[15px] leading-[1.6] text-white/60">
                  {f.body}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section 5 — The Insight                                                   */
/* -------------------------------------------------------------------------- */

const INSIGHT_ROWS = [
  { icon: ShoppingCart, label: "Groceries", trait: "Cashback, uncapped" },
  { icon: Plane, label: "Travel", trait: "Miles + lounge access" },
  { icon: Fuel, label: "Fuel", trait: "Surcharge waiver" },
  { icon: Receipt, label: "EMI Purchases", trait: "Low-cost tenure" },
];

function Insight() {
  return (
    <section className="relative py-[160px] max-md:py-[100px]">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-12 items-center gap-16 max-lg:grid-cols-1 max-lg:gap-12">
          {/* Left — narrative */}
          <div className="col-span-5 max-lg:col-span-1">
            <Reveal>
              <SectionEyebrow>The Insight</SectionEyebrow>
            </Reveal>

            <Reveal delay={0.08}>
              <h2 className="mt-6 font-butlerpro text-[58px] leading-[1.04] tracking-[-2.2px] text-white max-md:text-[36px] max-md:tracking-[-1px]">
                The best credit card{" "}
                <span className="text-[#F35A13] italic">isn&apos;t</span> one
                card.
              </h2>
            </Reveal>

            <Reveal delay={0.16}>
              <p className="mt-8 max-w-[440px] font-satoshi text-[16px] leading-[1.7] text-white/60 max-md:text-[15px]">
                The optimal card changes with context. Optimisation is not a
                decision, {" "}
                <span className="text-white">it&apos;s a habit.</span>
              </p>
            </Reveal>
          </div>

          {/* Right — comparison rows */}
          <Reveal delay={0.12} className="col-span-7 max-lg:col-span-1">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.025] to-transparent backdrop-blur-sm">
              {/* header */}
              <div className="flex items-center border-b border-white/[0.06] px-6 py-3 max-md:px-4">
                <span className="flex-1 font-satoshi text-[10.5px] tracking-[3px] uppercase text-white/40">
                  Category
                </span>
                <span className="font-satoshi text-[10.5px] tracking-[3px] uppercase text-white/40">
                  Wins on
                </span>
              </div>

              {INSIGHT_ROWS.map((row, i) => {
                const Icon = row.icon;
                const isLast = i === INSIGHT_ROWS.length - 1;
                return (
                  <motion.div
                    key={row.label}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{
                      delay: 0.1 + i * 0.08,
                      duration: 0.55,
                      ease,
                    }}
                    className={`group flex items-center px-6 py-5 transition-colors duration-300 hover:bg-white/[0.025] max-md:px-4 ${
                      !isLast ? "border-b border-white/[0.06]" : ""
                    }`}
                  >
                    <div className="flex flex-1 items-center gap-4 max-md:gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-white/70 transition-colors duration-300 group-hover:border-[#F35A13]/40 group-hover:text-[#F35A13]">
                        <Icon size={15} strokeWidth={1.6} />
                      </div>
                      <span className="font-satoshi text-[15px] text-white max-md:text-[14px]">
                        {row.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 max-md:gap-2">
                      <span className="font-satoshi text-[14px] text-[#F35A13] max-md:text-[12.5px]">
                        {row.trait}
                      </span>
                      <ArrowRight
                        size={13}
                        strokeWidth={1.6}
                        className="text-white/20 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-[#F35A13]"
                      />
                    </div>
                  </motion.div>
                );
              })}

              {/* footer */}
              <div className="border-t border-white/[0.06] bg-white/[0.015] px-6 py-3.5 max-md:px-4">
                <p className="font-satoshi text-[11px] tracking-[2.5px] uppercase text-white/35">
                  4 categories · 4 different winners
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section 6 — Founder Story                                                 */
/* -------------------------------------------------------------------------- */

const COMPANIES = [
  "ICICI Bank",
  "Standard Chartered",
  "RBL Bank",
  "IDFC Bank",
  "Northern Arc Capital",
  "Zinc",
];

const CREDS = [
  { icon: GraduationCap, label: "IIM Indore alumnus" },
  { icon: Clock, label: "18+ years experience" },
  { icon: Briefcase, label: "Banking · Fintech · Product" },
];

function FounderStory() {
  return (
    <section className="relative border-t border-white/[0.06] py-[140px] max-md:py-[80px]">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal className="text-left px-8">
          <SectionEyebrow>Founder</SectionEyebrow>
        </Reveal>

        <div className="mt-16 grid grid-cols-12 gap-14 max-lg:grid-cols-1 max-lg:gap-10">
          {/* Portrait */}
          <Reveal className="col-span-5 max-lg:col-span-1">
            <div className="relative mx-auto max-w-[420px]">
              <div
                aria-hidden
                className="absolute -inset-3 rounded-[28px] bg-[#F35A13]/15 blur-2xl"
              />
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-[#F35A13]/30 bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a]">
                <Image
                  src="/images/founder.png"
                  alt="Rajeev Ranjan, Founder & CEO of FiSense"
                  fill
                  sizes="(max-width: 1024px) 100vw, 420px"
                  className="object-cover"
                />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"
                />
                <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-black/40 p-6 backdrop-blur-sm">
                  <p className="font-satoshi text-[11px] tracking-[3px] uppercase text-[#F35A13]">
                    Founder & CEO
                  </p>
                  <p className="mt-2 font-butlerpro text-[22px] tracking-[-0.5px] text-white">
                    Rajeev Ranjan
                  </p>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Story */}
          <div className="col-span-7 max-lg:col-span-1">
            <Reveal>
              <h2 className="font-butlerpro text-[44px] leading-[1.1] tracking-[-1.5px] text-white max-md:text-[28px] max-md:tracking-[-0.5px]">
                Built by someone who saw the problem from the inside.
              </h2>
            </Reveal>

            <Reveal delay={0.1}>
              <p className="mt-8 max-w-[560px] font-satoshi text-[16px] leading-[1.7] text-white/65">
                Rajeev Ranjan spent over a decade building credit card and
                lending products across India&apos;s leading financial
                institutions, long enough to see exactly where value goes
                missing.
              </p>
            </Reveal>

            {/* Timeline */}
            <Reveal delay={0.16}>
              <div className="mt-10">
                <p className="font-satoshi text-[11px] tracking-[3px] uppercase text-white/40">
                  Career
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-3">
                  {COMPANIES.map((c, i) => (
                    <div key={c} className="flex items-center gap-3">
                      <span className="font-satoshi text-[14px] text-white/80">
                        {c}
                      </span>
                      {i < COMPANIES.length - 1 && (
                        <span className="text-white/20">·</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* Credentials */}
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="mt-10 grid grid-cols-3 gap-3 max-md:grid-cols-1"
            >
              {CREDS.map((cred) => {
                const Icon = cred.icon;
                return (
                  <motion.div
                    key={cred.label}
                    variants={fadeUp}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3"
                  >
                    <Icon size={16} className="text-[#F35A13]" strokeWidth={1.5} />
                    <span className="font-satoshi text-[13px] text-white/75">
                      {cred.label}
                    </span>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Highlighted quote */}
            <Reveal delay={0.1}>
              <div className="mt-12 rounded-2xl border-l-2 border-[#F35A13] bg-gradient-to-r from-[#F35A13]/10 via-[#F35A13]/[0.04] to-transparent px-6 py-5">
                <p className="font-butlerpro text-[24px] leading-[1.35] tracking-[-0.5px] text-white max-md:text-[19px]">
                  FiSense is the product he wished customers had.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section 7 — Mission                                                       */
/* -------------------------------------------------------------------------- */

function Mission() {
  return (
    <section className="relative overflow-hidden py-[180px] max-md:py-[110px]">
      {/* Soft glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      >
        <div className="h-[520px] w-[900px] max-md:w-[420px] max-md:h-[300px] rounded-full bg-[#F35A13]/15 blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1000px] px-6 text-center">
        <Reveal className="max-md:text-left">
          <SectionEyebrow>Our Mission</SectionEyebrow>
        </Reveal>

        <Reveal delay={0.1}>
          <h2 className="mx-auto max-md:text-left mt-8 max-w-[880px] font-butlerpro text-[72px] leading-[1.05] tracking-[-3px] text-white max-md:text-[38px] max-md:tracking-[-1px]">
            To become the{" "}
            <span className="text-[#F35A13] italic">intelligence layer</span>{" "}
            for every credit card user in India.
          </h2>
        </Reveal>

        <Reveal delay={0.2}>
          <p className="mx-auto max-md:text-left mt-10 max-w-[640px] font-satoshi text-[17px] leading-[1.7] text-white/65 max-md:text-[15px]">
            So that choosing better, spending smarter, and earning more
            isn&apos;t a privilege reserved for insiders.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section 8 — Contact                                                       */
/* -------------------------------------------------------------------------- */

function Contact() {
  return (
    <section className="relative border-t border-white/[0.06] py-[120px] max-md:py-[80px]">
      <div className="mx-auto max-w-[720px] px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-12 text-center max-md:p-8">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2"
            >
              <div className="h-64 w-64 rounded-full bg-[#F35A13]/15 blur-3xl" />
            </div>

            <div className="relative">
              <SectionEyebrow>Get in touch</SectionEyebrow>
              <h2 className="mt-5 font-butlerpro text-[48px] leading-[1.05] tracking-[-1.5px] text-white max-md:text-[32px] max-md:tracking-[-0.5px]">
                Let&apos;s Talk
              </h2>
              <p className="mx-auto mt-5 max-w-[440px] font-satoshi text-[15px] leading-[1.6] text-white/60">
                For feedback, partnerships, media enquiries, or support. We
                read every message.
              </p>

              <div className="mt-8 flex flex-col items-center gap-3 font-satoshi text-[14px]">
                <a
                  href="mailto:support@gofisense.com"
                  className="inline-flex items-center gap-2 text-white/80 transition-colors hover:text-[#F35A13]"
                >
                  <Mail size={14} strokeWidth={1.5} />
                  support@gofisense.com
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function About() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#0a0a0a] text-white">
      <Header />
      <Hero />
      <Divider />
      <HiddenSystem />
      <WhyFiSenseExists />
      <WhatWeDo />
      <Insight />
      <FounderStory />
      <Mission />
      <Contact />
      <Footer />
    </main>
  );
}
