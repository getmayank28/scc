"use client";
import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Header } from "@/components/Header";
import { Hero } from "./components/Hero";
import { CalculatorForm } from "./components/CalculatorForm";
import { CardSnapshot } from "./components/CardSnapshot";
import { YearlyValueBreakdown } from "./components/YearlyValueBreakdown";
import { SmartInsights } from "./components/SmartInsights";
import { VisualCharts } from "./components/VisualCharts";
import { BetterCardSuggestions } from "./components/BetterCardSuggestions";
import { computeResult, suggestBetterCards } from "./logic";
import type { CalculatorInputs } from "./types";

const DEFAULT_INPUTS: CalculatorInputs = {
  cardId: "hdfc-regalia",
  monthlySpend: 45000,
  travel: "occasional",
  wantsLoungeAccess: true,
};

export default function CardValueCalculatorPage() {
  const [inputs, setInputs] = useState<CalculatorInputs>(DEFAULT_INPUTS);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const formRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const liveResult = useMemo(() => computeResult(inputs), [inputs]);
  const suggestions = useMemo(
    () => (liveResult ? suggestBetterCards(liveResult.card) : []),
    [liveResult]
  );

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleAnalyze = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      requestAnimationFrame(() => {
        resultsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    }, 650);
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0a0a0c] text-white">
      <BackgroundLayer />

      <Header />

      <Hero onAnalyze={scrollToForm} />

      <main className="relative mx-auto max-w-6xl px-4 pb-32 md:px-6">
        <div ref={formRef} className="scroll-mt-24">
          <CalculatorForm
            inputs={inputs}
            onChange={(next) => {
              setInputs(next);
            }}
            onAnalyze={handleAnalyze}
            loading={loading}
          />
        </div>

        <AnimatePresence>
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-6 flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-white/70"
            >
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-orange opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-primary-orange" />
              </span>
              Crunching the numbers on your card...
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {submitted && liveResult && !loading && (
            <motion.div
              ref={resultsRef}
              key={liveResult.card.id + liveResult.netValue}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-8 scroll-mt-24 space-y-5 md:space-y-6"
            >
              <SectionLabel index="02" title="Card snapshot" />
              <CardSnapshot result={liveResult} />

              <SectionLabel index="03" title="Yearly value breakdown" />
              <YearlyValueBreakdown result={liveResult} />

              <SectionLabel index="04" title="Smart insights & score" />
              <SmartInsights result={liveResult} />

              <SectionLabel index="05" title="Visual breakdown" />
              <VisualCharts result={liveResult} />

              <SectionLabel index="06" title="Better matches" />
              <BetterCardSuggestions
                result={liveResult}
                suggestions={suggestions}
                onCompare={scrollToForm}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {!submitted && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#0a0a0c]/85 px-4 py-3 backdrop-blur-xl md:hidden"
          >
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full px-6 py-3 font-semibold text-white disabled:opacity-70"
            >
              <span
                aria-hidden
                className="absolute inset-0 bg-gradient-to-r from-primary-orange via-[#ff7a3d] to-primary-orange"
              />
              <span className="relative">
                {loading ? "Analyzing..." : "Analyze My Card"}
              </span>
              {!loading && <span className="relative">→</span>}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SectionLabel({ index, title }: { index: string; title: string }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <div className="font-mono text-xs text-primary-orange">{index}</div>
      <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent" />
      <div className="text-[11px] uppercase tracking-[0.2em] text-white/45">
        {title}
      </div>
    </div>
  );
}

function BackgroundLayer() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(1200px circle at 10% 0%, rgba(243, 90, 19, 0.10), transparent 50%), radial-gradient(900px circle at 90% 30%, rgba(94, 124, 255, 0.08), transparent 50%), linear-gradient(180deg, #0a0a0c 0%, #08080a 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
        }}
      />
    </>
  );
}
