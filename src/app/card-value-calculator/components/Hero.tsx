"use client";
import { motion } from "motion/react";
import { Plane, ArrowDown } from "lucide-react";

type HeroProps = {
  onAnalyze: () => void;
};

export function Hero({ onAnalyze }: HeroProps) {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(243, 90, 19, 0.18), transparent 60%), radial-gradient(ellipse 60% 60% at 80% 30%, rgba(120, 130, 255, 0.10), transparent 60%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse 60% 60% at 50% 40%, black, transparent 70%)",
        }}
      />

      <FloatingPlane className="left-[8%] top-[22%] hidden md:block" delay={0} />
      <FloatingPlane
        className="right-[12%] top-[60%] hidden md:block"
        delay={1.5}
      />

      <div className="relative mx-auto flex max-w-5xl flex-col items-center px-5 pt-28 pb-16 text-center md:pt-36 md:pb-24">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05 }}
          className="text-balance text-[40px] font-bold leading-[1.05] tracking-[-1.5px] text-white md:text-[68px] md:tracking-[-2.5px]"
        >
          Is Your Credit Card{" "}
          <span className="relative inline-block">
            <span className="bg-gradient-to-r from-[#f6c177] via-primary-orange to-[#ff7a3d] bg-clip-text text-transparent">
              Actually Worth It?
            </span>
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mt-5 max-w-2xl text-base leading-relaxed text-white/65 md:text-lg"
        >
          Discover your yearly rewards, lounge benefits, fee savings, and
          hidden value — all in one intelligent dashboard.
        </motion.p>

        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          onClick={onAnalyze}
          className="group relative mt-10 inline-flex items-center gap-2 overflow-hidden rounded-full px-7 py-3.5 font-semibold text-white"
        >
          <span
            aria-hidden
            className="absolute inset-0 bg-gradient-to-r from-primary-orange via-[#ff7a3d] to-primary-orange bg-[length:200%_100%] transition-[background-position] duration-700 group-hover:[background-position:100%_0%]"
          />
          <span
            aria-hidden
            className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{
              boxShadow: "0 0 40px rgba(243, 90, 19, 0.55)",
            }}
          />
          <span className="relative">Analyze My Card</span>
          <ArrowDown className="relative size-4 transition-transform group-hover:translate-y-0.5" />
        </motion.button>
      </div>
    </section>
  );
}

function FloatingPlane({
  className,
  delay,
}: {
  className?: string;
  delay: number;
}) {
  return (
    <motion.div
      className={`absolute ${className ?? ""}`}
      initial={{ opacity: 0, y: 30 }}
      animate={{
        opacity: [0, 0.4, 0.3, 0],
        y: [40, -10, -20, -50],
        x: [0, 30, 60, 120],
      }}
      transition={{
        duration: 8,
        delay,
        repeat: Infinity,
        repeatDelay: 4,
        ease: "easeInOut",
      }}
    >
      <Plane className="size-5 -rotate-12 text-white/40" />
    </motion.div>
  );
}
