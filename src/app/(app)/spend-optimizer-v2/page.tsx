"use client";

import { useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils/number";
import { bankIcon } from "@/lib/data/banks";
import Image from "next/image";
import {
  ChevronDown,
  TrendingUp,
  TicketPercent,
  CreditCard as CreditCardIcon,
  Check,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import {
  v2Cards,
  v2Categories,
  v2Merchants,
  TOP_CATEGORIES,
  mockOptimize,
  MAX_SELECTED,
  V2ResultCardResolved,
  V2Route,
} from "./data";

type Status = "idle" | "loading" | "done";
type Mode = "category" | "merchant";

const AMOUNT_CHIPS = [500, 2000, 5000, 15000, 50000];

const routeLabel: Record<V2Route, string> = {
  voucher: "Voucher first",
  swipe: "Swipe direct",
};

// money as a tabular readout, not body text
const inr = (n: number) => formatCurrency(String(Math.round(n)));

export default function SpendOptimizerV2() {
  // --- inputs ---
  const [selected, setSelected] = useState<string[]>(
    v2Cards.slice(0, MAX_SELECTED).map((c) => c._id),
  );
  const [cardsOpen, setCardsOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("category");
  const [category, setCategory] = useState("hotels");
  const [merchantValue, setMerchantValue] = useState("");
  const [amount, setAmount] = useState("5000");

  // --- output ---
  const [status, setStatus] = useState<Status>("idle");
  const [results, setResults] = useState<V2ResultCardResolved[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [ranWith, setRanWith] = useState<{ category: string; merchant: string }>({
    category: "",
    merchant: "",
  });

  const cat = useMemo(
    () => v2Categories.find((c) => c.value === ranWith.category),
    [ranWith.category],
  );

  const numericAmount = Number(amount.replace(/[^\d]/g, "")) || 0;
  const canSubmit =
    selected.length > 0 &&
    numericAmount > 0 &&
    (mode === "category" ? !!category : !!merchantValue);

  const winner = results[0];
  const runnerUp = results[1];
  const worst = results[results.length - 1];
  const upside = winner && worst ? winner.bestSavings - worst.bestSavings : 0;

  const atMax = selected.length >= MAX_SELECTED;

  function toggleCard(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((c) => c !== id);
      if (prev.length >= MAX_SELECTED) return prev;
      return [...prev, id];
    });
  }

  // one entry point. Merchant CTAs pass the merchant's implied category, so a
  // category/merchant mismatch is structurally impossible.
  function runFor(runCategory: string, runMerchant: string) {
    if (selected.length === 0 || numericAmount <= 0 || !runCategory) return;
    setRanWith({ category: runCategory, merchant: runMerchant });
    setStatus("loading");
    setShowAll(false);
    window.setTimeout(() => {
      setResults(mockOptimize(selected, runCategory, numericAmount));
      setStatus("done");
    }, 950);
  }

  function handleOptimize() {
    if (mode === "category") runFor(category, "");
    else {
      const m = v2Merchants.find((x) => x.value === merchantValue);
      if (m) runFor(m.category, m.label);
    }
  }

  function reset() {
    setStatus("idle");
    setResults([]);
  }

  return (
    <div className="so2-root min-h-screen">
      <StyleBlock />

      <main className="so2-page">
        <header className="so2-masthead">
          <div className="so2-eyebrow">
            <span className="so2-dot" />
            Card concierge · {v2Cards.length} cards on file
          </div>
          <h1 className="so2-display">The one card for this buy.</h1>
          <p className="so2-lede">
            Tell us what you&apos;re purchasing, and we&apos;ll calculate exactly which
            card in your wallet maximizes your return — instantly.
          </p>
        </header>

        <div className="so2-grid">
          {/* ============ LEFT: quick selects ============ */}
          <div className="so2-quick">
            {/* categories as tiles */}
            <section>
              <h3 className="so2-eyecaps">Jump straight to</h3>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {TOP_CATEGORIES.map((value) => {
                  const c = v2Categories.find((x) => x.value === value);
                  if (!c) return null;
                  return (
                    <button
                      key={value}
                      onClick={() => {
                        setMode("category");
                        setCategory(value);
                        runFor(value, "");
                      }}
                      disabled={status === "loading"}
                      className={`so2-tile ${
                        !ranWith.merchant && ranWith.category === value ? "is-on" : ""
                      }`}
                    >
                      <span className="so2-tile-label">{c.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* merchants as a 3-col tile grid */}
            <section>
              <h3 className="so2-eyecaps">Or a merchant</h3>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {v2Merchants.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => {
                      setMode("merchant");
                      setMerchantValue(m.value);
                      runFor(m.category, m.label);
                    }}
                    disabled={status === "loading"}
                    className={`so2-tile ${ranWith.merchant === m.label ? "is-on" : ""}`}
                  >
                    <span className="so2-tile-label">{m.label}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* wallet */}
            <section>
              <h3 className="so2-eyecaps">Your wallet</h3>
              <button onClick={() => setCardsOpen((o) => !o)} className="so2-wallet-toggle mt-3">
                <span className="flex items-center gap-2.5">
                  <span className="so2-wallet-stack" aria-hidden>
                    {selected.slice(0, 3).map((id, i) => {
                      const c = v2Cards.find((x) => x._id === id);
                      return (
                        <Image
                          key={id}
                          width={16}
                          height={16}
                          src={`/icons/banks/${bankIcon?.[c?.bankName ?? ""] ?? bankIcon?.default}`}
                          alt=""
                          style={{ marginLeft: i === 0 ? 0 : -7, zIndex: 3 - i }}
                          className="so2-wallet-chip"
                        />
                      );
                    })}
                  </span>
                  <span className="so2-body">
                    <span className="so2-mono">{selected.length}</span> of {MAX_SELECTED} cards in play
                  </span>
                </span>
                <ChevronDown className={`h-4 w-4 so2-mut transition ${cardsOpen ? "rotate-180" : ""}`} />
              </button>

              {cardsOpen && (
                <div className="mt-3">
                  <div className="mb-2.5 flex items-center justify-between text-xs">
                    <span className={atMax ? "so2-accent font-semibold" : "so2-mut"}>
                      {atMax ? "Wallet full — swap one to change" : `Add up to ${MAX_SELECTED}`}
                    </span>
                    <button
                      onClick={() => setSelected([])}
                      disabled={selected.length === 0}
                      className="so2-mut font-semibold underline-offset-2 hover:underline disabled:opacity-40"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {v2Cards.map((card) => {
                      const on = selected.includes(card._id);
                      const locked = !on && atMax;
                      return (
                        <button
                          key={card._id}
                          onClick={() => toggleCard(card._id)}
                          disabled={locked}
                          aria-pressed={on}
                          className={`so2-card-pick ${on ? "is-on" : ""} ${locked ? "is-locked" : ""}`}
                        >
                          <Image
                            width={18}
                            height={18}
                            src={`/icons/banks/${bankIcon?.[card.bankName] ?? bankIcon?.default}`}
                            alt=""
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[0.8rem] font-semibold">
                              {card.name}
                            </span>
                            <span className="block truncate text-[0.68rem] so2-mut">
                              {card.bankName}
                            </span>
                          </span>
                          {on && (
                            <span className="so2-tick">
                              <Check className="h-3 w-3" strokeWidth={3} />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* ============ RIGHT: precision panel OR result ============ */}
          <div className="so2-right">
            {status === "idle" && (
              <section className="so2-panel">
                <h2 className="so2-panel-title">Set it up precisely</h2>

                {/* tabs */}
                <div className="so2-tabs">
                  {(["category", "merchant"] as Mode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={`so2-tab ${mode === m ? "is-active" : ""}`}
                    >
                      By {m}
                    </button>
                  ))}
                </div>

                <div className="so2-panel-body">
                  {/* field */}
                  <div className="so2-field-group">
                    <label className="so2-field-label">
                      {mode === "category" ? "What are you buying?" : "Where are you paying?"}
                    </label>
                    {mode === "category" ? (
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="so2-underline">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="!max-h-[300px]">
                          {v2Categories.map((c) => {
                            const Icon = c.icon;
                            return (
                              <SelectItem key={c.value} value={c.value}>
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4 so2-accent" />
                                  {c.label}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Select value={merchantValue} onValueChange={setMerchantValue}>
                        <SelectTrigger className="so2-underline">
                          <SelectValue placeholder="Pick a merchant" />
                        </SelectTrigger>
                        <SelectContent className="!max-h-[300px]">
                          {v2Merchants.map((m) => (
                            <SelectItem key={m.value} value={m.value}>
                              <div className="flex items-center gap-2">
                                <span>{m.emoji}</span>
                                {m.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* amount */}
                  <div className="so2-field-group">
                    <label className="so2-field-label">Estimated amount</label>
                    <div className="so2-amount-line">
                      <span className="so2-amount-currency">₹</span>
                      <Input
                        inputMode="numeric"
                        value={formatCurrency(amount).replace("₹", "")}
                        onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
                        className="so2-amount-input"
                        placeholder="0"
                      />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {AMOUNT_CHIPS.map((v) => (
                        <button
                          key={v}
                          onClick={() => setAmount(String(v))}
                          className={`so2-amt-chip ${numericAmount === v ? "is-active" : ""}`}
                        >
                          ₹{v >= 1000 ? `${v / 1000}k` : v}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="so2-panel-foot">
                  {selected.length === 0 ? (
                    <p className="so2-hint">Add at least one card to compare.</p>
                  ) : mode === "merchant" && !merchantValue ? (
                    <p className="so2-hint">Pick a merchant, or tap one above.</p>
                  ) : (
                    <span />
                  )}
                  <button onClick={handleOptimize} disabled={!canSubmit} className="so2-cta">
                    Find my card <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </section>
            )}

            {status === "loading" && <ResultSkeleton />}

            {status === "done" && winner && (
              <div className="so2-reveal">
                {/* THE TICKET */}
                <div className="so2-ticket">
                  <div className="so2-ticket-head">
                    <span className="so2-ticket-eyebrow">Use this card</span>
                    <button onClick={reset} className="so2-restart">
                      <ArrowLeft className="h-3.5 w-3.5" /> Start over
                    </button>
                  </div>

                  <div className="so2-ticket-body">
                    <div className="flex items-center gap-3">
                      <span className="so2-bank-badge">
                        <Image
                          width={22}
                          height={22}
                          src={`/icons/banks/${bankIcon?.[winner.bankName] ?? bankIcon?.default}`}
                          alt=""
                        />
                      </span>
                      <div className="min-w-0">
                        <div className="so2-ticket-card truncate">{winner.cardName}</div>
                        <div className="so2-ticket-bank">{winner.bankName}</div>
                      </div>
                      <span className="ml-auto">
                        <RouteBadge route={winner.bestRoute} />
                      </span>
                    </div>

                    <div className="so2-savings">
                      <div className="so2-savings-label">You keep</div>
                      <div className="so2-savings-amt so2-mono">{inr(winner.bestSavings)}</div>
                      <div className="so2-savings-rate">
                        <TrendingUp className="h-3.5 w-3.5" />
                        {winner.bestRatePct.toFixed(1)}% back on {inr(numericAmount)}
                      </div>
                    </div>
                  </div>

                  <div className="so2-perf" aria-hidden>
                    <span className="so2-notch so2-notch-l" />
                    <span className="so2-notch so2-notch-r" />
                  </div>

                  <div className="so2-stub">
                    <p className="so2-instruction">
                      <span className="so2-instruction-tag">Do this</span>
                      {winner.bestRoute === "voucher"
                        ? `Buy a ${cat?.label.toLowerCase()} gift voucher on your bank portal, then pay with ${winner.cardName}.`
                        : `Pay directly with ${winner.cardName}${ranWith.merchant ? ` at ${ranWith.merchant}` : ""}.`}
                    </p>
                    <button className="so2-ticket-cta">
                      {winner.bestRoute === "voucher" ? (
                        <>
                          <TicketPercent className="h-[18px] w-[18px]" />
                          Buy voucher · save {inr(winner.bestSavings)}
                        </>
                      ) : (
                        <>
                          <CreditCardIcon className="h-[18px] w-[18px]" />
                          Continue to pay
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {upside > 0 && (
                  <p className="so2-upside">
                    Picking this over your weakest card is worth{" "}
                    <span className="so2-mono so2-accent font-semibold">+{inr(upside)}</span>
                    {runnerUp && (
                      <>
                        {" "}· runner-up {runnerUp.cardName} ({inr(runnerUp.bestSavings)})
                      </>
                    )}
                  </p>
                )}

                <div className="so2-compare">
                  <button onClick={() => setShowAll((s) => !s)} className="so2-compare-toggle">
                    <span>See all {results.length} cards, side by side</span>
                    <ChevronDown className={`h-4 w-4 so2-mut transition ${showAll ? "rotate-180" : ""}`} />
                  </button>

                  {showAll && (
                    <div className="so2-compare-body">
                      <div className="so2-compare-head">
                        <span>Card</span>
                        <span className="text-right">Voucher</span>
                        <span className="text-right">Swipe</span>
                      </div>
                      {results.map((c) => (
                        <div key={c.cardId} className={`so2-compare-row ${c.isBestCard ? "is-best" : ""}`}>
                          <div className="flex items-center gap-2">
                            <Image
                              width={16}
                              height={16}
                              src={`/icons/banks/${bankIcon?.[c.bankName] ?? bankIcon?.default}`}
                              alt=""
                            />
                            <div className="min-w-0">
                              <div className="truncate text-[0.82rem] font-semibold">{c.cardName}</div>
                              {c.isBestCard && <span className="so2-best-tag">Winner</span>}
                            </div>
                          </div>
                          <ValueCell value={c.voucherSavingsInInr} amount={numericAmount} highlight={c.bestRoute === "voucher"} />
                          <ValueCell value={c.directSwipeSavingsInInr} amount={numericAmount} highlight={c.bestRoute === "swipe"} />
                        </div>
                      ))}
                      <p className="so2-compare-note">
                        <b>Voucher</b> — buy a brand gift card via your bank portal, then pay.{" "}
                        <b>Swipe</b> — pay directly. We bold whichever earns more.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function RouteBadge({ route }: { route: V2Route }) {
  const isVoucher = route === "voucher";
  return (
    <span className="so2-route">
      {isVoucher ? <TicketPercent className="h-3 w-3" /> : <CreditCardIcon className="h-3 w-3" />}
      {routeLabel[route]}
    </span>
  );
}

function ValueCell({
  value,
  amount,
  highlight,
}: {
  value: number;
  amount: number;
  highlight: boolean;
}) {
  const pct = amount > 0 ? (value / amount) * 100 : 0;
  return (
    <div className="text-right">
      <div className={`so2-mono text-[0.82rem] font-semibold ${highlight ? "so2-win" : "so2-mut"}`}>
        {value > 0 ? inr(value) : "—"}
      </div>
      {value > 0 && <div className="so2-mono text-[0.62rem] so2-mut opacity-70">{pct.toFixed(1)}%</div>}
    </div>
  );
}

function ResultSkeleton() {
  return (
    <div className="so2-reveal">
      <div className="so2-ticket so2-ticket--loading">
        <div className="so2-ticket-body space-y-4">
          <div className="so2-skel h-8 w-40" />
          <div className="so2-skel h-14 w-56" />
          <div className="so2-skel h-4 w-32" />
        </div>
        <div className="so2-perf" aria-hidden>
          <span className="so2-notch so2-notch-l" />
          <span className="so2-notch so2-notch-r" />
        </div>
        <div className="so2-stub space-y-3">
          <div className="so2-skel h-4 w-full" />
          <div className="so2-skel h-11 w-full" />
        </div>
      </div>
    </div>
  );
}

function StyleBlock() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&family=Hanken+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap');

      .so2-root {
        /* Material-3 warm-ember token palette from the reference */
        --bg: #1e100c;
        --surface-low: #180b07;
        --surface: #2c1c17;
        --surface-high: #372621;
        --surface-highest: #43302b;
        --variant: #43302b;
        --outline: #5b4039;
        --ink: #fadcd4;              /* on-background */
        --ink-variant: #e4beb4;      /* on-surface-variant */
        --mut: #ab8980;              /* outline / muted text */
        --primary: #ffb5a0;          /* primary */
        --primary-container: #ff5722;/* accent action */
        --win: #7ddc9a;
        --paper: #fadcd4;            /* inverse-surface → the ticket paper */
        --paper-ink: #3e2c27;        /* inverse-on-surface */
        --paper-mut: #8a5f54;

        --serif: 'Libre Caslon Text', Georgia, serif;
        --sans: 'Hanken Grotesk', ui-sans-serif, system-ui, sans-serif;
        --mono: 'JetBrains Mono', ui-monospace, monospace;

        background:
          radial-gradient(120% 80% at 88% -10%, rgba(255,87,34,0.10), transparent 55%),
          var(--bg);
        color: var(--ink);
        font-family: var(--sans);
      }

      .so2-mono { font-family: var(--mono); font-feature-settings: "tnum" 1; }
      .so2-mut { color: var(--mut); }
      .so2-accent { color: var(--primary); }
      .so2-win { color: var(--win); }
      .so2-body { font-size: 0.9rem; color: var(--ink-variant); }

      /* page frame */
      .so2-page {
        max-width: 1180px; margin: 0 auto;
        padding: 56px 24px 40px;
      }
      @media (min-width: 768px) { .so2-page { padding: 72px 40px 48px; } }

      /* masthead */
      .so2-eyebrow {
        display: inline-flex; align-items: center; gap: 8px;
        font-family: var(--mono); font-size: 0.72rem; font-weight: 500;
        letter-spacing: 0.12em; text-transform: uppercase; color: var(--mut);
      }
      .so2-dot {
        width: 7px; height: 7px; border-radius: 999px; background: var(--primary-container);
        box-shadow: 0 0 8px rgba(255,87,34,0.5); animation: so2-pulse 2.4s ease-in-out infinite;
      }
      @keyframes so2-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
      .so2-display {
        font-family: var(--serif); font-weight: 700;
        font-size: clamp(2rem, 4vw, 3rem); line-height: 1.05; letter-spacing: -0.02em;
        margin-top: 16px; color: var(--ink);
      }
      .so2-lede {
        margin-top: 12px; max-width: 42rem;
        font-size: 1.05rem; line-height: 1.6; color: var(--ink-variant);
      }

      /* layout: quick selects | precision panel */
      .so2-grid { margin-top: 40px; display: grid; grid-template-columns: 1fr; gap: 24px; }
      @media (min-width: 1024px) {
        .so2-grid { grid-template-columns: minmax(0,5fr) minmax(0,7fr); gap: 32px; align-items: start; }
      }
      .so2-quick { display: flex; flex-direction: column; gap: 32px; }
      .so2-right { min-width: 0; }
      @media (min-width: 1024px) { .so2-right { position: sticky; top: 40px; } }

      .so2-eyecaps {
        font-family: var(--mono); font-size: 0.72rem; font-weight: 500;
        letter-spacing: 0.14em; text-transform: uppercase; color: var(--mut);
      }

      /* category + merchant tiles (shared, text-only) */
      .so2-tile {
        display: flex; align-items: center; justify-content: center;
        height: 62px; padding: 0 10px; border-radius: 12px;
        background: var(--surface-low); color: var(--ink);
        box-shadow: inset 1px 1px 0 rgba(255,255,255,0.05);
        border: 1px solid transparent;
        transition: background .2s, border-color .2s, color .2s, transform .12s;
      }
      .so2-tile:hover:not(:disabled) { background: var(--surface-high); color: var(--primary); transform: translateY(-1px); }
      .so2-tile.is-on { border-color: var(--primary); background: var(--surface-high); color: var(--primary); }
      .so2-tile:disabled { opacity: .5; }
      .so2-tile-label { font-size: 0.88rem; text-align: center; line-height: 1.2; }

      /* wallet */
      .so2-wallet-toggle {
        display: flex; align-items: center; justify-content: space-between; width: 100%;
        padding: 12px 15px; border-radius: 12px;
        background: var(--surface-low); box-shadow: inset 1px 1px 0 rgba(255,255,255,0.05);
        transition: background .2s;
      }
      .so2-wallet-toggle:hover { background: var(--surface); }
      .so2-wallet-stack { display: inline-flex; align-items: center; }
      .so2-wallet-chip { border-radius: 5px; padding: 3px; background: var(--surface-high); box-shadow: 0 0 0 1.5px var(--bg); }

      .so2-card-pick {
        display: flex; align-items: center; gap: 9px; text-align: left;
        padding: 10px 11px; border-radius: 11px;
        border: 1px solid var(--outline); background: var(--surface-low);
        transition: border-color .2s, background .2s, opacity .2s;
      }
      .so2-card-pick:hover:not(:disabled) { border-color: var(--primary); }
      .so2-card-pick.is-on { border-color: var(--primary); background: var(--surface-high); }
      .so2-card-pick.is-locked { opacity: .38; cursor: not-allowed; }
      .so2-tick { display:inline-flex; align-items:center; justify-content:center; width:18px; height:18px; border-radius:6px; background: var(--primary-container); color:#fff; flex-shrink:0; }

      /* ===== precision panel ===== */
      .so2-panel {
        display: flex; flex-direction: column;
        background: var(--surface-high); border-radius: 16px; padding: 28px;
        box-shadow: inset 1px 1px 0 rgba(255,255,255,0.06), 0 24px 60px -40px rgba(0,0,0,0.9);
      }
      .so2-panel-title { font-family: var(--serif); font-size: 1.5rem; font-weight: 600; color: var(--ink); }

      .so2-tabs { display: flex; gap: 4px; margin-top: 20px; border-bottom: 1px solid var(--variant); }
      .so2-tab {
        position: relative; padding: 10px 12px; margin-bottom: -1px;
        font-size: 0.95rem; text-transform: capitalize; color: var(--mut);
        border-bottom: 2px solid transparent; transition: color .2s, border-color .2s;
      }
      .so2-tab.is-active { color: var(--primary); border-bottom-color: var(--primary); }
      .so2-tab:hover:not(.is-active) { color: var(--ink); }

      .so2-panel-body { display: flex; flex-direction: column; gap: 28px; padding: 28px 0; }
      .so2-field-group { display: flex; flex-direction: column; }
      .so2-field-label {
        font-family: var(--mono); font-size: 0.72rem; font-weight: 500;
        letter-spacing: 0.1em; text-transform: uppercase; color: var(--mut); margin-bottom: 10px;
      }

      /* underline select trigger */
      .so2-underline {
        height: auto !important; width: 100%;
        background: transparent !important; border: none !important;
        border-bottom: 1px solid var(--variant) !important; border-radius: 0 !important;
        padding: 0 0 10px 0 !important; color: var(--ink);
        font-size: 1.1rem; box-shadow: none !important;
        transition: border-color .2s;
      }
      .so2-underline:hover { border-bottom-color: var(--outline) !important; }
      .so2-underline:focus, .so2-underline[data-state="open"] {
        outline: none; border-bottom-color: var(--primary) !important; box-shadow: none !important;
      }

      /* amount underline */
      .so2-amount-line { display: flex; align-items: baseline; gap: 8px; border-bottom: 1px solid var(--variant); padding-bottom: 8px; transition: border-color .2s; }
      .so2-amount-line:focus-within { border-bottom-color: var(--primary); }
      .so2-amount-currency { font-family: var(--mono); font-size: 1.25rem; color: var(--mut); }
      .so2-amount-input {
        flex: 1; background: transparent !important; border: none !important; box-shadow: none !important;
        padding: 0 !important; height: auto !important;
        font-family: var(--serif); font-size: 2rem; font-weight: 700; letter-spacing: -0.01em; color: var(--ink);
      }
      .so2-amount-input:focus { outline: none; box-shadow: none !important; }

      .so2-amt-chip {
        padding: 6px 12px; border-radius: 7px; background: var(--surface-low); color: var(--ink);
        font-family: var(--mono); font-size: 0.78rem; box-shadow: inset 1px 1px 0 rgba(255,255,255,0.05);
        transition: background .18s, color .18s, border-color .18s; border: 1px solid transparent;
      }
      .so2-amt-chip:hover { background: var(--surface-high); }
      .so2-amt-chip.is-active { background: rgba(255,181,160,0.12); color: var(--primary); border-color: var(--primary); }

      .so2-panel-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-top: 20px; border-top: 1px solid var(--variant); }
      .so2-hint { font-size: 0.78rem; color: var(--primary); }
      .so2-cta {
        display: inline-flex; align-items: center; gap: 8px;
        padding: 13px 26px; border-radius: 999px; white-space: nowrap;
        background: var(--primary-container); color: #1a0a05;
        font-family: var(--mono); font-size: 0.8rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase;
        box-shadow: 0 0 20px rgba(255,87,34,0.3); transition: transform .15s, filter .2s, opacity .2s;
      }
      .so2-cta:hover:not(:disabled) { filter: brightness(1.05); transform: scale(0.98); }
      .so2-cta:disabled { opacity: .4; box-shadow: none; }

      /* ===== THE TICKET ===== */
      .so2-ticket { position: relative; background: var(--paper); color: var(--paper-ink); border-radius: 16px; overflow: hidden; box-shadow: 0 30px 70px -30px rgba(0,0,0,0.75); }
      .so2-ticket-head { display: flex; align-items: center; justify-content: space-between; padding: 14px 22px; border-bottom: 1px dashed rgba(62,44,39,0.2); }
      .so2-ticket-eyebrow { font-family: var(--mono); font-size: 0.66rem; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: var(--primary-container); }
      .so2-restart { display: inline-flex; align-items: center; gap: 5px; font-size: 0.75rem; color: var(--paper-mut); }
      .so2-restart:hover { color: var(--paper-ink); }
      .so2-ticket-body { padding: 22px; }
      .so2-bank-badge { display:inline-flex; align-items:center; justify-content:center; width: 40px; height: 40px; border-radius: 10px; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.12); flex-shrink: 0; }
      .so2-ticket-card { font-family: var(--serif); font-size: 1.4rem; font-weight: 700; letter-spacing: -0.01em; line-height: 1.1; }
      .so2-ticket-bank { font-family: var(--mono); font-size: 0.66rem; letter-spacing: 0.06em; text-transform: uppercase; color: var(--paper-mut); }
      .so2-savings { margin-top: 22px; }
      .so2-savings-label { font-family: var(--mono); font-size: 0.64rem; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: var(--paper-mut); }
      .so2-savings-amt { font-size: 3.4rem; line-height: 1; font-weight: 600; margin-top: 4px; color: var(--paper-ink); letter-spacing: -0.02em; }
      .so2-savings-rate { display: inline-flex; align-items: center; gap: 5px; margin-top: 8px; font-size: 0.82rem; font-weight: 600; color: #2f7d4f; }
      .so2-route { display: inline-flex; align-items: center; gap: 5px; padding: 5px 10px; border-radius: 999px; background: rgba(255,87,34,0.12); color: var(--primary-container); font-family: var(--mono); font-size: 0.62rem; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; white-space: nowrap; }

      .so2-perf { position: relative; height: 0; border-top: 2px dashed rgba(62,44,39,0.24); margin: 0 18px; }
      .so2-notch { position: absolute; top: -10px; width: 20px; height: 20px; border-radius: 999px; background: var(--bg); }
      .so2-notch-l { left: -28px; } .so2-notch-r { right: -28px; }

      .so2-stub { padding: 20px 22px 22px; }
      .so2-instruction { font-size: 0.92rem; line-height: 1.5; color: #5a4238; }
      .so2-instruction-tag { display: inline-block; margin-right: 8px; padding: 2px 7px; border-radius: 5px; background: var(--paper-ink); color: var(--paper); font-family: var(--mono); font-size: 0.58rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; vertical-align: 1px; }
      .so2-ticket-cta { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; height: 50px; margin-top: 16px; border-radius: 12px; background: var(--paper-ink); color: var(--paper); font-size: 0.92rem; font-weight: 600; transition: transform .15s, filter .2s; }
      .so2-ticket-cta:hover { filter: brightness(1.15); transform: translateY(-1px); }

      .so2-ticket--loading { min-height: 300px; }
      .so2-skel { border-radius: 8px; background: linear-gradient(90deg, rgba(62,44,39,0.06), rgba(62,44,39,0.14), rgba(62,44,39,0.06)); background-size: 200% 100%; animation: so2-shimmer 1.3s ease infinite; }
      @keyframes so2-shimmer { to { background-position: -200% 0; } }

      .so2-upside { margin-top: 16px; padding: 13px 16px; border-radius: 12px; border: 1px solid var(--variant); background: var(--surface-low); font-size: 0.82rem; line-height: 1.45; color: var(--ink-variant); text-align: center; }

      .so2-compare { margin-top: 16px; border: 1px solid var(--variant); border-radius: 14px; background: var(--surface-low); overflow: hidden; }
      .so2-compare-toggle { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 15px 18px; font-size: 0.85rem; color: var(--ink); }
      .so2-compare-body { border-top: 1px solid var(--variant); padding: 6px; }
      .so2-compare-head { display: grid; grid-template-columns: 1.5fr 1fr 1fr; gap: 8px; padding: 8px 12px; font-family: var(--mono); font-size: 0.6rem; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; color: var(--mut); }
      .so2-compare-row { display: grid; grid-template-columns: 1.5fr 1fr 1fr; align-items: center; gap: 8px; padding: 11px 12px; border-radius: 9px; }
      .so2-compare-row.is-best { background: rgba(255,87,34,0.10); }
      .so2-best-tag { font-family: var(--mono); font-size: 0.58rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--primary-container); }
      .so2-compare-note { padding: 10px 12px 6px; font-size: 0.72rem; line-height: 1.5; color: var(--mut); }
      .so2-compare-note b { color: var(--ink); }

      .so2-footnote { margin-top: 40px; text-align: center; font-family: var(--mono); font-size: 0.68rem; letter-spacing: 0.06em; color: var(--mut); opacity: 0.7; }

      .so2-reveal { animation: so2-rise .5s cubic-bezier(.2,.7,.3,1) both; }
      @keyframes so2-rise { from { opacity: 0; transform: translateY(14px) scale(.985); } to { opacity: 1; transform: none; } }

      @media (prefers-reduced-motion: reduce) {
        .so2-reveal, .so2-dot, .so2-skel { animation: none !important; transition: none !important; }
      }
    `}</style>
  );
}
