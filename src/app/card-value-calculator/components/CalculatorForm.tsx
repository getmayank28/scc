"use client";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, ChevronDown, IndianRupee, Plane, Search } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { GlassCard } from "./GlassCard";
import { CARDS, TRAVEL_OPTIONS } from "../data";
import { formatINR } from "../logic";
import type { CalculatorInputs } from "../types";

type CalculatorFormProps = {
  inputs: CalculatorInputs;
  onChange: (next: CalculatorInputs) => void;
  onAnalyze: () => void;
  loading?: boolean;
};

export function CalculatorForm({
  inputs,
  onChange,
  onAnalyze,
  loading,
}: CalculatorFormProps) {
  const [cardPickerOpen, setCardPickerOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedCard = useMemo(
    () => CARDS.find((c) => c.id === inputs.cardId) ?? CARDS[0],
    [inputs.cardId]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CARDS;
    return CARDS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.bank.toLowerCase().includes(q)
    );
  }, [query]);

  const update = <K extends keyof CalculatorInputs>(
    key: K,
    value: CalculatorInputs[K]
  ) => onChange({ ...inputs, [key]: value });

  return (
    <GlassCard glow className="p-5 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-primary-orange">
            Step 01
          </div>
          <h2 className="mt-1 text-xl font-semibold text-white md:text-2xl">
            Tell us about your card
          </h2>
        </div>
        <div className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/60 md:flex">
          <span className="size-1.5 rounded-full bg-primary-orange" />
          Live preview
        </div>
      </div>

      <div className="grid gap-6">
        <Field label="Credit card">
          <div className="relative">
            <button
              type="button"
              onClick={() => setCardPickerOpen((v) => !v)}
              className="group flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-left transition hover:border-white/20 hover:bg-white/[0.06]"
            >
              <div className="flex items-center gap-3">
                <CardLogo card={selectedCard} />
                <div>
                  <div className="text-sm font-semibold text-white">
                    {selectedCard.bank} {selectedCard.name}
                  </div>
                  <div className="text-[11px] uppercase tracking-wide text-white/45">
                    {selectedCard.network} · {selectedCard.tier}
                  </div>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  "size-4 text-white/60 transition-transform",
                  cardPickerOpen && "rotate-180"
                )}
              />
            </button>

            <AnimatePresence>
              {cardPickerOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-white/10 bg-[#161616]/95 backdrop-blur-xl"
                >
                  <div className="border-b border-white/5 p-2">
                    <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
                      <Search className="size-3.5 text-white/40" />
                      <input
                        autoFocus
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search by card or bank"
                        className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
                      />
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto p-1.5">
                    {filtered.map((c) => {
                      const selected = c.id === inputs.cardId;
                      return (
                        <button
                          key={c.id}
                          onClick={() => {
                            update("cardId", c.id);
                            setCardPickerOpen(false);
                            setQuery("");
                          }}
                          className={cn(
                            "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition",
                            selected
                              ? "bg-primary-orange/10"
                              : "hover:bg-white/5"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <CardLogo card={c} />
                            <div>
                              <div className="text-sm font-medium text-white">
                                {c.bank} {c.name}
                              </div>
                              <div className="text-[11px] text-white/45">
                                Fee {formatINR(c.annualFee)} · {c.network}
                              </div>
                            </div>
                          </div>
                          {selected && (
                            <Check className="size-4 text-primary-orange" />
                          )}
                        </button>
                      );
                    })}
                    {filtered.length === 0 && (
                      <div className="px-3 py-6 text-center text-sm text-white/40">
                        No cards match &ldquo;{query}&rdquo;
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Field>

        <Field
          label="Monthly spend"
          rightSlot={
            <div className="text-xs text-white/55">
              <span className="text-white/40">Yearly · </span>
              <span className="font-semibold text-white">
                {formatINR(inputs.monthlySpend * 12)}
              </span>
            </div>
          }
        >
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary-orange/15">
                <IndianRupee className="size-4 text-primary-orange" />
              </div>
              <Input
                type="number"
                value={inputs.monthlySpend}
                onChange={(e) =>
                  update("monthlySpend", Number(e.target.value || 0))
                }
                containerClassName="h-auto"
                className="!h-11 border-none bg-transparent px-1 text-2xl font-bold !text-white shadow-none focus-visible:ring-0 md:!text-3xl"
              />
            </div>
            <div className="mt-4">
              <Slider
                value={[inputs.monthlySpend]}
                onValueChange={(v) => update("monthlySpend", v[0] ?? 0)}
                min={5000}
                max={500000}
                step={1000}
              />
              <div className="mt-2 flex justify-between text-[10px] uppercase tracking-wider text-white/35">
                <span>₹5k</span>
                <span>₹2.5L</span>
                <span>₹5L</span>
              </div>
            </div>
          </div>
        </Field>

        <Field label="Travel frequency">
          <div className="grid grid-cols-3 gap-2">
            {TRAVEL_OPTIONS.map((opt) => {
              const selected = inputs.travel === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => update("travel", opt.value)}
                  className={cn(
                    "relative overflow-hidden rounded-xl border px-3 py-3 text-left transition",
                    selected
                      ? "border-primary-orange/60 bg-primary-orange/10"
                      : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
                  )}
                >
                  {selected && (
                    <motion.div
                      layoutId="travel-highlight"
                      className="absolute inset-0 -z-10"
                      style={{
                        background:
                          "radial-gradient(circle at 30% 0%, rgba(243,90,19,0.25), transparent 60%)",
                      }}
                      transition={{ type: "spring", duration: 0.4 }}
                    />
                  )}
                  <div
                    className={cn(
                      "text-sm font-semibold",
                      selected ? "text-white" : "text-white/85"
                    )}
                  >
                    {opt.label}
                  </div>
                  <div className="mt-0.5 text-[10px] text-white/45 md:text-[11px]">
                    {opt.hint}
                  </div>
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Lounge access">
          <button
            onClick={() =>
              update("wantsLoungeAccess", !inputs.wantsLoungeAccess)
            }
            className={cn(
              "flex w-full items-center justify-between rounded-xl border px-4 py-3.5 transition",
              inputs.wantsLoungeAccess
                ? "border-primary-orange/50 bg-primary-orange/10"
                : "border-white/10 bg-white/[0.04] hover:bg-white/[0.06]"
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex size-9 items-center justify-center rounded-lg transition",
                  inputs.wantsLoungeAccess
                    ? "bg-primary-orange/25 text-primary-orange"
                    : "bg-white/5 text-white/60"
                )}
              >
                <Plane className="size-4" />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-white">
                  I want airport lounge access
                </div>
                <div className="text-[11px] text-white/45">
                  We&rsquo;ll factor it into your value calculation
                </div>
              </div>
            </div>
            <div
              className={cn(
                "relative h-6 w-11 rounded-full transition",
                inputs.wantsLoungeAccess
                  ? "bg-primary-orange"
                  : "bg-white/15"
              )}
            >
              <motion.div
                layout
                transition={{ type: "spring", stiffness: 600, damping: 30 }}
                className={cn(
                  "absolute top-0.5 size-5 rounded-full bg-white shadow-md",
                  inputs.wantsLoungeAccess ? "right-0.5" : "left-0.5"
                )}
              />
            </div>
          </button>
        </Field>

        <button
          onClick={onAnalyze}
          disabled={loading}
          className="group relative mt-2 inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl px-6 py-4 font-semibold text-white shadow-[0_10px_30px_rgba(243,90,19,0.25)] disabled:opacity-70"
        >
          <span
            aria-hidden
            className="absolute inset-0 bg-gradient-to-r from-primary-orange via-[#ff7a3d] to-primary-orange bg-[length:200%_100%] transition-[background-position] duration-700 group-hover:[background-position:100%_0%]"
          />
          <span className="relative">
            {loading ? "Analyzing..." : "Analyze My Card"}
          </span>
          {!loading && (
            <span className="relative transition-transform group-hover:translate-x-0.5">
              →
            </span>
          )}
        </button>
      </div>
    </GlassCard>
  );
}

function Field({
  label,
  children,
  rightSlot,
}: {
  label: string;
  children: React.ReactNode;
  rightSlot?: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/50">
          {label}
        </label>
        {rightSlot}
      </div>
      {children}
    </div>
  );
}

function CardLogo({ card }: { card: (typeof CARDS)[number] }) {
  return (
    <div
      className={cn(
        "flex size-10 items-center justify-center rounded-lg bg-gradient-to-br text-[10px] font-bold text-white",
        card.cardGradient
      )}
      style={{
        boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.08), 0 4px 12px ${card.accent}33`,
      }}
    >
      {card.bankShort.slice(0, 4).toUpperCase()}
    </div>
  );
}
