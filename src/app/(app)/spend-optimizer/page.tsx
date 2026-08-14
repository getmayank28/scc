"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import {
  ChevronDown,
  TrendingUp,
  TicketPercent,
  CreditCard as CreditCardIcon,
  Check,
  ArrowRight,
  ArrowLeft,
  CirclePlus,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { SearchboxInput } from "@/components/SearchBoxInput";
import { formatCurrency } from "@/lib/utils/number";
import { bankIcon } from "@/lib/data/banks";
import useNav from "@/lib/hooks/useNav";
import useUserData from "@/lib/hooks/useUserData";
import { useGetUserCardsQuery } from "@/store/api";
import { useGetPortalsQuery } from "@/store/admin";
import {
  useAddSpendTransactionMutation,
  useOptimizeSpendMutation,
  useGetMerchantCategoriesQuery,
} from "@/store/spendTransaction";
import { useAnalytics } from "@/lib/analytics/hooks/useAnalytics";
import { EventName } from "@/lib/analytics/types";
import type { CreditCard } from "@/types/card";
import type { PortalProps } from "@/models/Portal";
import {
  categories,
  quickMerchants,
  TOP_CATEGORIES,
  MAX_SELECTED,
  AMOUNT_CHIPS,
  merchantLabel,
  type OptimizedCardResult,
} from "./data";

type Status = "idle" | "loading" | "done";
type Mode = "category" | "merchant";

const inr = (n: number) => formatCurrency(String(Math.round(n)));

const routeLabel: Record<OptimizedCardResult["bestRoute"], string> = {
  voucher: "Voucher first",
  swipe: "Swipe direct",
};

/** A wallet card flattened out of the populated UserCard row. */
interface WalletCard {
  slug: string;
  name: string;
  bankName: string;
}

export default function SpendOptimizerPage() {
  const { track } = useAnalytics();
  const { userId } = useUserData();
  const { navigateToProfile } = useNav();

  const { data: rawCards, isFetching: isCardsLoading } = useGetUserCardsQuery({
    userId,
  });
  const { data: portals, isFetching: isPortalFetching } = useGetPortalsQuery({});
  const [optimizeSpend, { isLoading: isOptimizing }] = useOptimizeSpendMutation();
  const [addSpendTransaction] = useAddSpendTransactionMutation();

  // --- inputs ---
  const [selected, setSelected] = useState<string[]>([]);
  const [cardsOpen, setCardsOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("category");
  const [category, setCategory] = useState("online-shopping");
  const [merchantValue, setMerchantValue] = useState("");
  const [amount, setAmount] = useState("5000");

  // --- output ---
  const [status, setStatus] = useState<Status>("idle");
  const [results, setResults] = useState<OptimizedCardResult[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [ranWith, setRanWith] = useState({
    category: "",
    merchant: "",
    amount: 0,
    merchantMatched: true,
    unsupportedCards: [] as string[],
  });

  useEffect(() => {
    track(EventName.SPEND_OPTIMIZER_VIEWED, {});
  }, [track]);

  // Only cards that actually resolved to an advisor slug can be scored; a
  // wallet row whose card doc is missing would otherwise render as a blank tile.
  const wallet = useMemo<WalletCard[]>(() => {
    if (!Array.isArray(rawCards)) return [];
    return rawCards
      .map((c: CreditCard) => c?.cardId)
      .filter((c): c is CreditCard["cardId"] => Boolean(c?.slug))
      .map((c) => ({
        slug: c.slug,
        name: c.name,
        bankName: c.bankName,
      }));
  }, [rawCards]);

  // Preselect up to MAX_SELECTED once the wallet arrives.
  useEffect(() => {
    if (wallet.length === 0) return;
    setSelected((prev) =>
      prev.length > 0 ? prev : wallet.slice(0, MAX_SELECTED).map((c) => c.slug),
    );
  }, [wallet]);

  const merchantOptions = useMemo(
    () =>
      (portals ?? []).map((p: PortalProps & { _id: string }) => ({
        _id: p._id,
        value: p.name,
        name: p.name,
      })),
    [portals],
  );

  // Which categories the chosen merchant actually has rules in. Skipped until a
  // merchant is picked; `skipToken`-style guard via the `skip` option.
  const { data: merchantCats, isFetching: isMerchantCatsLoading } =
    useGetMerchantCategoriesQuery(merchantValue, {
      skip: mode !== "merchant" || !merchantValue,
    });

  const merchantCategoryOptions = useMemo(() => {
    const values: string[] = merchantCats?.result?.categories ?? [];
    return categories.filter((c) => values.includes(c.value));
  }, [merchantCats]);

  // A merchant we hold no rules for: the query resolved, but with nothing in it.
  const merchantIsUnknown =
    !!merchantValue &&
    !isMerchantCatsLoading &&
    merchantCats?.result?.known === false;

  // Adopt the merchant's category automatically. When it has exactly one, that
  // is the answer; when it has several, seed the picker with the first so the
  // form is never in an impossible state (e.g. Ajio + Hotels).
  useEffect(() => {
    if (mode !== "merchant" || merchantCategoryOptions.length === 0) return;
    setCategory((prev) =>
      merchantCategoryOptions.some((c) => c.value === prev)
        ? prev
        : merchantCategoryOptions[0].value,
    );
  }, [mode, merchantCategoryOptions]);

  const numericAmount = Number(amount.replace(/[^\d]/g, "")) || 0;
  const atMax = selected.length >= MAX_SELECTED;
  const canSubmit =
    selected.length > 0 &&
    numericAmount > 0 &&
    (mode === "category" ? !!category : !!merchantValue) &&
    !isOptimizing;

  const winner = results[0];
  const runnerUp = results[1];
  const worst = results[results.length - 1];
  const upside =
    winner && worst ? winner.bestSavingsInInr - worst.bestSavingsInInr : 0;

  const ranCategory = useMemo(
    () => categories.find((c) => c.value === ranWith.category),
    [ranWith.category],
  );

  // On mobile the result panel sits below the inputs, so a tap on a category or
  // merchant tile appears to do nothing — the answer renders off-screen. Bring
  // it into view. Desktop keeps the two-column layout with the panel already
  // visible, so scrolling there would be disorienting; the 1024px check mirrors
  // the `.so-grid` breakpoint.
  const resultRef = useRef<HTMLDivElement>(null);
  const scrollToResultOnMobile = useCallback(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(min-width: 1024px)").matches) return;
    // Wait for the skeleton to be laid out before measuring.
    requestAnimationFrame(() => {
      resultRef.current?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start",
      });
    });
  }, []);

  function toggleCard(slug: string) {
    const card = wallet.find((c) => c.slug === slug);
    setSelected((prev) => {
      const isOn = prev.includes(slug);
      if (!isOn && prev.length >= MAX_SELECTED) return prev;
      const next = isOn ? prev.filter((c) => c !== slug) : [...prev, slug];
      track(
        isOn
          ? EventName.SPEND_OPTIMIZER_CARD_DESELECTED
          : EventName.SPEND_OPTIMIZER_CARD_SELECTED,
        {
          cardId: slug,
          cardName: card?.name ?? "",
          bankName: card?.bankName ?? "",
          selectedCardCount: next.length,
        },
      );
      return next;
    });
  }

  // Single entry point. Merchant CTAs pass the merchant's implied category, so
  // a category/merchant mismatch is structurally impossible.
  async function runFor(runCategory: string, runMerchant: string) {
    if (selected.length === 0) {
      toast.error("Add at least one card to compare");
      return;
    }
    if (numericAmount <= 0) {
      toast.error("Enter an amount");
      return;
    }

    track(EventName.SPEND_OPTIMIZER_FORM_SUBMITTED, {
      category: runCategory,
      amount: numericAmount,
      merchant: runMerchant,
      transactionMode: mode === "merchant" ? "online" : "offline",
      selectedCardCount: selected.length,
    });

    setStatus("loading");
    setShowAll(false);
    // Scroll now, not on completion: the user sees the skeleton immediately and
    // the page doesn't jump under them once the response lands.
    scrollToResultOnMobile();

    try {
      const res = await optimizeSpend({
        category: runCategory,
        amountInr: numericAmount,
        merchant: runMerchant || undefined,
        cardSlugs: selected,
      }).unwrap();

      const cards: OptimizedCardResult[] = res?.result?.cards ?? [];
      setResults(cards);
      setRanWith({
        category: runCategory,
        merchant: runMerchant,
        amount: numericAmount,
        merchantMatched: res?.result?.merchantMatched ?? true,
        unsupportedCards: res?.result?.unsupportedCards ?? [],
      });
      setStatus("done");

      if (cards.length === 0) {
        toast.error("No results for those cards");
        return;
      }

      track(EventName.SPEND_OPTIMIZER_RESULT_VIEWED, {
        category: runCategory,
        amount: numericAmount,
        merchant: runMerchant,
        transactionMode: mode === "merchant" ? "online" : "offline",
        bestCardName: cards[0]?.cardName ?? null,
        bestCardSavings: cards[0]?.bestSavingsInInr ?? null,
        totalCardsCompared: cards.length,
      });

      // Persist for the history view, in the shape it already expects.
      addSpendTransaction({
        userId,
        category: runCategory,
        amount: String(numericAmount),
        merchant: runMerchant,
        transactionMode: mode === "merchant" ? "online" : "offline",
        cards: cards.map((c) => ({
          cardId: c.cardId,
          cardName: c.cardName,
          directSwipePortalLink: "",
          directSwipeSavingsInInr: c.directSwipeSavingsInInr,
          isBestCard: c.isBestCard,
          isDirectSwipePortalSavings: false,
          voucherSavingsInInr: c.voucherSavingsInInr,
        })),
      });
    } catch {
      setStatus("idle");
      toast.error("Couldn't optimize this spend. Please try again.");
    }
  }

  function handleOptimize() {
    if (mode === "category") {
      runFor(category, "");
    } else {
      const quick = quickMerchants.find((m) => m.label === merchantValue);
      runFor(quick?.category ?? category, merchantValue);
    }
  }

  function reset() {
    track(EventName.SPEND_OPTIMIZER_EDIT_INPUT_CLICKED, {});
    setStatus("idle");
    setResults([]);
  }

  const busy = status === "loading" || isOptimizing;

  return (
    <div className="so-root min-h-screen bg-brown-background">
      <StyleBlock />

      <main className="so-page">
        <header className="so-masthead">
          <div className="so-eyebrow">
            <span className="so-dot" />
            {isCardsLoading
              ? "Loading your wallet…"
              : `Card concierge · ${wallet.length} card${wallet.length === 1 ? "" : "s"} on file`}
          </div>
          <h1 className="so-display">The one card for this buy.</h1>
          <p className="so-lede">
          Tell us what you’re buying, and we’ll instantly find the card that gives you the best return.
          </p>
        </header>

        <div className="so-grid">
          {/* ============ LEFT: quick selects ============ */}
          <div className="so-quick">
            <section>
              <h3 className="so-eyecaps">Jump straight to</h3>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {TOP_CATEGORIES.map((value) => {
                  const c = categories.find((x) => x.value === value);
                  if (!c) return null;
                  const on = !ranWith.merchant && ranWith.category === value;
                  return (
                    <button
                      key={value}
                      onClick={() => {
                        setMode("category");
                        setCategory(value);
                        runFor(value, "");
                      }}
                      disabled={busy}
                      className={`so-tile ${on ? "is-on" : ""}`}
                    >
                      <span className="so-tile-label">{c.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section>
              <h3 className="so-eyecaps">Or a merchant</h3>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {quickMerchants.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => {
                      setMode("merchant");
                      setMerchantValue(m.label);
                      track(EventName.SPEND_OPTIMIZER_MERCHANT_SELECTED, {
                        merchant: m.label,
                      });
                      runFor(m.category, m.label);
                    }}
                    disabled={busy}
                    className={`so-tile ${ranWith.merchant === m.label ? "is-on" : ""}`}
                  >
                    <span className="so-tile-label">{m.label}</span>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h3 className="so-eyecaps">Your wallet</h3>

              {isCardsLoading ? (
                <div className="so-skel mt-3 h-[46px] w-full" />
              ) : wallet.length === 0 ? (
                <button
                  onClick={() => {
                    track(EventName.SPEND_OPTIMIZER_ADD_CARD_CLICKED, {});
                    navigateToProfile();
                  }}
                  className="so-empty-wallet mt-3"
                >
                  <CirclePlus className="h-4 w-4" />
                  Add your cards to start optimizing
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setCardsOpen((o) => !o)}
                    className="so-wallet-toggle mt-3"
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="so-wallet-stack" aria-hidden>
                        {selected.slice(0, 3).map((slug, i) => {
                          const c = wallet.find((x) => x.slug === slug);
                          return (
                            <Image
                              key={slug}
                              width={16}
                              height={16}
                              src={`/icons/banks/${bankIcon?.[c?.bankName ?? ""] ?? bankIcon?.default}`}
                              alt=""
                              style={{ marginLeft: i === 0 ? 0 : -7, zIndex: 3 - i }}
                              className="so-wallet-chip"
                            />
                          );
                        })}
                      </span>
                      <span className="so-body">
                        <span className="so-mono">{selected.length}</span> of{" "}
                        {MAX_SELECTED} cards in play
                      </span>
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 so-mut transition ${cardsOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {cardsOpen && (
                    <div className="mt-3">
                      <div className="mb-2.5 flex items-center justify-between text-xs">
                        <span className={atMax ? "so-accent font-semibold" : "so-mut"}>
                          {atMax
                            ? "Wallet full — swap one to change"
                            : `Add up to ${MAX_SELECTED}`}
                        </span>
                        <button
                          onClick={() => setSelected([])}
                          disabled={selected.length === 0}
                          className="so-mut font-semibold underline-offset-2 hover:underline disabled:opacity-40"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {wallet.map((card) => {
                          const on = selected.includes(card.slug);
                          const locked = !on && atMax;
                          return (
                            <button
                              key={card.slug}
                              onClick={() => toggleCard(card.slug)}
                              disabled={locked}
                              aria-pressed={on}
                              className={`so-card-pick ${on ? "is-on" : ""} ${locked ? "is-locked" : ""}`}
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
                                <span className="block truncate text-[0.68rem] so-mut">
                                  {card.bankName}
                                </span>
                              </span>
                              {on && (
                                <span className="so-tick">
                                  <Check className="h-3 w-3" strokeWidth={3} />
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </section>
          </div>

          {/* ============ RIGHT: precision panel OR result ============ */}
          <div className="so-right" ref={resultRef}>
            {status === "idle" && (
              <section className="so-panel">
                <h2 className="so-panel-title">Set it up precisely</h2>

                <div className="so-tabs">
                  {(["category", "merchant"] as Mode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={`so-tab ${mode === m ? "is-active" : ""}`}
                    >
                      By {m}
                    </button>
                  ))}
                </div>

                <div className="so-panel-body">
                  <div className="so-field-group">
                    <label className="so-field-label">
                      {mode === "category"
                        ? "What are you buying?"
                        : "Where are you paying?"}
                    </label>
                    {mode === "category" ? (
                      <Select
                        value={category}
                        onValueChange={(v) => {
                          track(EventName.SPEND_OPTIMIZER_CATEGORY_CHANGED, {
                            category: v,
                            previousCategory: category,
                          });
                          setCategory(v);
                        }}
                      >
                        <SelectTrigger className="so-underline">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="!max-h-[300px]">
                          {categories.map((c) => {
                            const Icon = c.icon;
                            return (
                              <SelectItem key={c.value} value={c.value}>
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4 so-accent" />
                                  {c.label}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="so-searchbox">
                        <SearchboxInput
                          disabled={isPortalFetching}
                          options={merchantOptions}
                          value={merchantValue}
                          onChange={(val) => {
                            if (val) {
                              track(
                                EventName.SPEND_OPTIMIZER_MERCHANT_SELECTED,
                                { merchant: val },
                              );
                            }
                            setMerchantValue(val);
                          }}
                          placeholder="Search 500+ merchants…"
                        />
                        {/* The category is inferred from the merchant whenever
                            it can be — only genuinely multi-category merchants
                            (MakeMyTrip, Swiggy…) are worth asking about, and
                            then only among that merchant's real options. */}
                        {merchantCategoryOptions.length > 1 && (
                          <>
                            <p className="so-field-note">
                              {merchantValue} covers a few categories — which one is
                              this?
                            </p>
                            <Select value={category} onValueChange={setCategory}>
                              <SelectTrigger className="so-underline mt-2">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="!max-h-[300px]">
                                {merchantCategoryOptions.map((c) => {
                                  const Icon = c.icon;
                                  return (
                                    <SelectItem key={c.value} value={c.value}>
                                      <div className="flex items-center gap-2">
                                        <Icon className="h-4 w-4 so-accent" />
                                        {c.label}
                                      </div>
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </>
                        )}
                        {merchantValue &&
                          merchantCategoryOptions.length === 1 && (
                            <p className="so-field-note">
                              Scoring as{" "}
                              <b>
                                {merchantCategoryOptions[0].label.toLowerCase()}
                              </b>
                              .
                            </p>
                          )}
                        {merchantValue && merchantIsUnknown && (
                          <p className="so-field-note">
                            No {merchantValue}-specific offers yet — we&apos;ll use
                            the best card for{" "}
                            <b>
                              {categories
                                .find((c) => c.value === category)
                                ?.label.toLowerCase()}
                            </b>
                            .
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="so-field-group">
                    <label className="so-field-label">Estimated amount</label>
                    <div className="so-amount-line">
                      <span className="so-amount-currency">₹</span>
                      <Input
                        inputMode="numeric"
                        value={formatCurrency(amount).replace("₹", "")}
                        onChange={(e) =>
                          setAmount(e.target.value.replace(/[^\d]/g, ""))
                        }
                        onBlur={() =>
                          numericAmount > 0 &&
                          track(EventName.SPEND_OPTIMIZER_AMOUNT_ENTERED, {
                            amount: numericAmount,
                          })
                        }
                        className="so-amount-input"
                        placeholder="0"
                      />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {AMOUNT_CHIPS.map((v) => (
                        <button
                          key={v}
                          onClick={() => setAmount(String(v))}
                          className={`so-amt-chip ${numericAmount === v ? "is-active" : ""}`}
                        >
                          ₹{v >= 1000 ? `${v / 1000}k` : v}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="so-panel-foot">
                  {wallet.length === 0 ? (
                    <p className="so-hint">Add a card to compare.</p>
                  ) : selected.length === 0 ? (
                    <p className="so-hint">Select at least one card.</p>
                  ) : mode === "merchant" && !merchantValue ? (
                    <p className="so-hint">Pick a merchant, or tap one above.</p>
                  ) : (
                    <span />
                  )}
                  <button
                    onClick={handleOptimize}
                    disabled={!canSubmit}
                    className="so-cta"
                  >
                    Find my card <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </section>
            )}

            {status === "loading" && <ResultSkeleton />}

            {status === "done" && winner && (
              <div className="so-reveal">
                <div className="so-ticket">
                  <div className="so-ticket-head">
                    <span className="so-ticket-eyebrow">Use this card</span>
                    <button onClick={reset} className="so-restart">
                      <ArrowLeft className="h-3.5 w-3.5" /> Start over
                    </button>
                  </div>

                  <div className="so-ticket-body">
                    <div className="flex items-center gap-3">
                      <span className="so-bank-badge">
                        <Image
                          width={22}
                          height={22}
                          src={`/icons/banks/${bankIcon?.[winner.bankName] ?? bankIcon?.default}`}
                          alt=""
                        />
                      </span>
                      <div className="min-w-0">
                        <div className="so-ticket-card truncate">
                          {winner.cardName}
                        </div>
                        <div className="so-ticket-bank">{winner.bankName}</div>
                      </div>
                      <span className="ml-auto">
                        <RouteBadge route={winner.bestRoute} />
                      </span>
                    </div>

                    <div className="so-savings">
                      <div className="so-savings-label">You keep</div>
                      <div className="so-savings-amt so-mono">
                        {inr(winner.bestSavingsInInr)}
                      </div>
                      <div className="so-savings-rate">
                        <TrendingUp className="h-3.5 w-3.5" />
                        {winner.bestRatePct.toFixed(1)}% back on{" "}
                        {inr(ranWith.amount)}
                      </div>
                    </div>
                  </div>

                  <div className="so-perf" aria-hidden>
                    <span className="so-notch so-notch-l" />
                    <span className="so-notch so-notch-r" />
                  </div>

                  <div className="so-stub">
                    <p className="so-instruction">
                      <span className="so-instruction-tag">Do this</span>
                      {winner.bestRoute === "voucher"
                        ? `Buy a ${ranCategory?.label.toLowerCase() ?? "gift"} voucher on your bank portal, then pay with ${winner.cardName}.`
                        : `Pay directly with ${winner.cardName}${ranWith.merchant ? ` at ${ranWith.merchant}` : ""}.`}
                    </p>
                    {winner.capNote && (
                      <p className="so-capnote">Cap: {winner.capNote}</p>
                    )}
                  </div>
                </div>

                {!ranWith.merchantMatched && ranWith.merchant && (
                  <p className="so-notice">
                    We don&apos;t have {ranWith.merchant}-specific offers yet — this
                    is the best card for {ranCategory?.label.toLowerCase()} overall.
                  </p>
                )}

                {ranWith.unsupportedCards.length > 0 && (
                  <p className="so-notice">
                    We couldn&apos;t score{" "}
                    {ranWith.unsupportedCards.length === 1
                      ? "1 of your selected cards"
                      : `${ranWith.unsupportedCards.length} of your selected cards`}{" "}
                    — we don&apos;t have reward data for{" "}
                    {ranWith.unsupportedCards.map(merchantLabel).join(", ")} yet.
                  </p>
                )}

                {upside > 0 && (
                  <p className="so-upside">
                    Picking this over your weakest card is worth{" "}
                    <span className="so-mono so-accent font-semibold">
                      +{inr(upside)}
                    </span>
                    {runnerUp && (
                      <>
                        {" "}
                        · runner-up {runnerUp.cardName} (
                        {inr(runnerUp.bestSavingsInInr)})
                      </>
                    )}
                  </p>
                )}

                <div className="so-compare">
                  <button
                    onClick={() => setShowAll((s) => !s)}
                    className="so-compare-toggle"
                  >
                    <span>
                      See all {results.length} card
                      {results.length === 1 ? "" : "s"}, side by side
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 so-mut transition ${showAll ? "rotate-180" : ""}`}
                    />
                  </button>

                  {showAll && (
                    <div className="so-compare-body">
                      <div className="so-compare-head">
                        <span>Card</span>
                        <span className="text-right">Voucher</span>
                        <span className="text-right">Swipe</span>
                      </div>
                      {results.map((c) => (
                        <div
                          key={c.cardId}
                          className={`so-compare-row ${c.isBestCard ? "is-best" : ""}`}
                        >
                          <div className="flex items-center gap-2">
                            <Image
                              width={16}
                              height={16}
                              src={`/icons/banks/${bankIcon?.[c.bankName] ?? bankIcon?.default}`}
                              alt=""
                            />
                            <div className="min-w-0">
                              <div className="truncate text-[0.82rem] font-semibold">
                                {c.cardName}
                              </div>
                              {c.isBestCard && (
                                <span className="so-best-tag">Winner</span>
                              )}
                            </div>
                          </div>
                          <ValueCell
                            value={c.voucherSavingsInInr}
                            amount={ranWith.amount}
                            highlight={c.bestRoute === "voucher"}
                            // Only worth naming when the user didn't pick the
                            // merchant — otherwise it just repeats their choice.
                            via={
                              !ranWith.merchant && c.voucherMerchant
                                ? merchantLabel(c.voucherMerchant)
                                : null
                            }
                          />
                          <ValueCell
                            value={c.directSwipeSavingsInInr}
                            amount={ranWith.amount}
                            highlight={c.bestRoute === "swipe"}
                          />
                        </div>
                      ))}
                      <p className="so-compare-note">
                        <b>Voucher</b> — buy a brand gift card via your bank portal,
                        then pay. <b>Swipe</b> — pay directly. We bold whichever
                        earns more.
                        {!ranWith.merchant && (
                          <>
                            {" "}
                            Voucher figures are tied to one brand, so they only win
                            the recommendation once you pick that merchant.
                          </>
                        )}
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

function RouteBadge({ route }: { route: OptimizedCardResult["bestRoute"] }) {
  const isVoucher = route === "voucher";
  return (
    <span className="so-route">
      {isVoucher ? (
        <TicketPercent className="h-3 w-3" />
      ) : (
        <CreditCardIcon className="h-3 w-3" />
      )}
      {routeLabel[route]}
    </span>
  );
}

function ValueCell({
  value,
  amount,
  highlight,
  via,
}: {
  value: number;
  amount: number;
  highlight: boolean;
  /** Brand this figure is earned through, shown so the number is interpretable. */
  via?: string | null;
}) {
  const pct = amount > 0 ? (value / amount) * 100 : 0;
  return (
    <div className="text-right">
      <div
        className={`so-mono text-[0.82rem] font-semibold ${highlight ? "so-win" : "so-mut"}`}
      >
        {value > 0 ? inr(value) : "—"}
      </div>
      {value > 0 && (
        <div className="so-mono text-[0.62rem] so-mut opacity-70">
          {pct.toFixed(1)}%
        </div>
      )}
      {value > 0 && via && (
        <div className="so-via" title={`Voucher bought for ${via}`}>
          via {via}
        </div>
      )}
    </div>
  );
}

function ResultSkeleton() {
  return (
    <div className="so-reveal">
      <div className="so-ticket so-ticket--loading">
        <div className="so-ticket-body space-y-4">
          <div className="so-skel-dark h-8 w-40" />
          <div className="so-skel-dark h-14 w-56" />
          <div className="so-skel-dark h-4 w-32" />
        </div>
        <div className="so-perf" aria-hidden>
          <span className="so-notch so-notch-l" />
          <span className="so-notch so-notch-r" />
        </div>
        <div className="so-stub space-y-3">
          <div className="so-skel-dark h-4 w-full" />
          <div className="so-skel-dark h-11 w-full" />
        </div>
      </div>
    </div>
  );
}

function StyleBlock() {
  return (
    <style>{`
      /* Palette maps onto the app's own tokens (globals.css) rather than the
         prototype's ember scheme, and uses the app's Satoshi/Hubot faces. */
      .so-root {
        --so-bg: var(--brown-background);
        --so-surface-low: color-mix(in oklab, var(--brown-background) 88%, black);
        --so-surface: var(--brown-sidebar);
        --so-surface-high: color-mix(in oklab, var(--brown-sidebar) 88%, white 12%);
        --so-outline: var(--brown-border);
        --so-ink: oklch(0.97 0.008 60);
        --so-ink-variant: oklch(0.86 0.014 55);
        --so-mut: var(--secondary-gray);
        --so-primary: var(--primary-orange);
        --so-action: var(--primary-orange);
        --so-win: var(--secondary-success);
        --so-paper: oklch(0.96 0.012 60);
        --so-paper-ink: oklch(0.26 0.018 52);
        --so-paper-mut: oklch(0.52 0.03 45);

        --so-sans: var(--font-satoshi), ui-sans-serif, system-ui, sans-serif;
        --so-display-face: var(--font-hubot), var(--font-satoshi), sans-serif;
        --so-mono: ui-monospace, "SF Mono", Menlo, monospace;

        background: var(--so-bg);
        color: var(--so-ink);
        font-family: var(--so-sans);
      }

      .so-mono { font-family: var(--so-mono); font-feature-settings: "tnum" 1; }
      .so-mut { color: var(--so-mut); }
      .so-accent { color: var(--so-primary); }
      .so-win { color: var(--so-win); }
      .so-body { font-size: 0.9rem; color: var(--so-ink-variant); }

      .so-page { max-width: 1180px; margin: 0 auto; padding: 32px 20px 40px; }
      @media (min-width: 768px) { .so-page { padding: 72px 40px 48px; } }

      .so-eyebrow {
        display: inline-flex; align-items: center; gap: 8px;
        font-family: var(--so-mono); font-size: 0.72rem; font-weight: 500;
        letter-spacing: 0.12em; text-transform: uppercase; color: var(--so-mut);
      }
      .so-dot {
        width: 7px; height: 7px; border-radius: 999px; background: var(--so-action);
        box-shadow: 0 0 8px color-mix(in oklab, var(--primary-orange) 50%, transparent);
        animation: so-pulse 2.4s ease-in-out infinite;
      }
      @keyframes so-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
      .so-display {
        font-family: var(--so-display-face); font-weight: 700;
        font-size: clamp(1.75rem, 4vw, 3rem); line-height: 1.05; letter-spacing: -0.02em;
        margin-top: 16px; color: var(--so-ink);
      }
      .so-lede {
        margin-top: 12px; max-width: 42rem;
        font-size: 1rem; line-height: 1.6; color: var(--so-ink-variant);
      }
      @media (min-width: 768px) { .so-lede { font-size: 1.05rem; } }

      /* One layout, two breakpoints — no separate mobile/desktop trees. */
      .so-grid { margin-top: 32px; display: grid; grid-template-columns: 1fr; gap: 24px; }
      @media (min-width: 1024px) {
        .so-grid { margin-top: 40px; grid-template-columns: minmax(0,5fr) minmax(0,7fr); gap: 32px; align-items: start; }
      }
      .so-quick { display: flex; flex-direction: column; gap: 28px; }
      /* scroll-margin keeps the scrolled-to result clear of the app header
         instead of butting against the top of the viewport. */
      .so-right { min-width: 0; scroll-margin-top: 16px; }
      @media (min-width: 1024px) { .so-right { position: sticky; top: 40px; } }

      .so-eyecaps {
        font-family: var(--so-mono); font-size: 0.72rem; font-weight: 500;
        letter-spacing: 0.14em; text-transform: uppercase; color: var(--so-mut);
      }

      .so-tile {
        display: flex; align-items: center; justify-content: center;
        height: 62px; padding: 0 10px; border-radius: 12px;
        background: var(--so-surface-low); color: var(--so-ink);
        box-shadow: inset 1px 1px 0 rgba(255,255,255,0.05);
        border: 1px solid transparent;
        transition: background .2s, border-color .2s, color .2s, transform .12s;
      }
      .so-tile:hover:not(:disabled) { background: var(--so-surface-high); color: var(--so-primary); transform: translateY(-1px); }
      .so-tile.is-on { border-color: var(--so-primary); background: var(--so-surface-high); color: var(--so-primary); }
      .so-tile:disabled { opacity: .5; }
      .so-tile-label { font-size: 0.85rem; text-align: center; line-height: 1.2; }

      .so-wallet-toggle {
        display: flex; align-items: center; justify-content: space-between; width: 100%;
        padding: 12px 15px; border-radius: 12px;
        background: var(--so-surface-low); box-shadow: inset 1px 1px 0 rgba(255,255,255,0.05);
        transition: background .2s;
      }
      .so-wallet-toggle:hover { background: var(--so-surface); }
      .so-wallet-stack { display: inline-flex; align-items: center; }
      .so-wallet-chip { border-radius: 5px; padding: 3px; background: var(--so-surface-high); box-shadow: 0 0 0 1.5px var(--so-bg); }

      .so-empty-wallet {
        display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%;
        padding: 14px 15px; border-radius: 12px; font-size: 0.85rem; font-weight: 600;
        border: 1px dashed var(--so-outline); color: var(--so-primary);
        transition: background .2s, border-color .2s;
      }
      .so-empty-wallet:hover { background: var(--so-surface-low); border-color: var(--so-primary); }

      .so-card-pick {
        display: flex; align-items: center; gap: 9px; text-align: left;
        padding: 10px 11px; border-radius: 11px;
        border: 1px solid var(--so-outline); background: var(--so-surface-low);
        transition: border-color .2s, background .2s, opacity .2s;
      }
      .so-card-pick:hover:not(:disabled) { border-color: var(--so-primary); }
      .so-card-pick.is-on { border-color: var(--so-primary); background: var(--so-surface-high); }
      .so-card-pick.is-locked { opacity: .38; cursor: not-allowed; }
      .so-tick { display:inline-flex; align-items:center; justify-content:center; width:18px; height:18px; border-radius:6px; background: var(--so-action); color:#fff; flex-shrink:0; }

      .so-panel {
        display: flex; flex-direction: column;
        background: var(--so-surface-high); border-radius: 16px; padding: 20px;
        box-shadow: inset 1px 1px 0 rgba(255,255,255,0.06), 0 24px 60px -40px rgba(0,0,0,0.9);
      }
      @media (min-width: 768px) { .so-panel { padding: 28px; } }
      .so-panel-title { font-family: var(--so-display-face); font-size: 1.35rem; font-weight: 700; color: var(--so-ink); }
      @media (min-width: 768px) { .so-panel-title { font-size: 1.5rem; } }

      .so-tabs { display: flex; gap: 4px; margin-top: 20px; border-bottom: 1px solid var(--so-outline); }
      .so-tab {
        position: relative; padding: 10px 12px; margin-bottom: -1px;
        font-size: 0.95rem; text-transform: capitalize; color: var(--so-mut);
        border-bottom: 2px solid transparent; transition: color .2s, border-color .2s;
      }
      .so-tab.is-active { color: var(--so-primary); border-bottom-color: var(--so-primary); }
      .so-tab:hover:not(.is-active) { color: var(--so-ink); }

      .so-panel-body { display: flex; flex-direction: column; gap: 24px; padding: 24px 0; }
      @media (min-width: 768px) { .so-panel-body { gap: 28px; padding: 28px 0; } }
      .so-field-group { display: flex; flex-direction: column; }
      .so-field-label {
        font-family: var(--so-mono); font-size: 0.72rem; font-weight: 500;
        letter-spacing: 0.1em; text-transform: uppercase; color: var(--so-mut); margin-bottom: 10px;
      }
      .so-field-note { margin-top: 10px; font-size: 0.72rem; color: var(--so-mut); }

      .so-underline {
        height: auto !important; width: 100%;
        background: transparent !important; border: none !important;
        border-bottom: 1px solid var(--so-outline) !important; border-radius: 0 !important;
        padding: 0 0 10px 0 !important; color: var(--so-ink);
        font-size: 1.05rem; box-shadow: none !important;
        transition: border-color .2s;
      }
      .so-underline:hover { border-bottom-color: var(--so-mut) !important; }
      .so-underline:focus, .so-underline[data-state="open"] {
        outline: none; border-bottom-color: var(--so-primary) !important; box-shadow: none !important;
      }

      /* The shared SearchboxInput ships its own chrome; tone it to this panel. */
      .so-searchbox input {
        background: var(--so-surface-low) !important;
        border-color: var(--so-outline) !important;
        color: var(--so-ink) !important;
      }
      .so-searchbox input:focus { border-color: var(--so-primary) !important; }

      .so-amount-line { display: flex; align-items: baseline; gap: 8px; border-bottom: 1px solid var(--so-outline); padding-bottom: 8px; transition: border-color .2s; }
      .so-amount-line:focus-within { border-bottom-color: var(--so-primary); }
      .so-amount-currency { font-family: var(--so-mono); font-size: 1.25rem; color: var(--so-mut); }
      .so-amount-input {
        flex: 1; background: transparent !important; border: none !important; box-shadow: none !important;
        padding: 0 !important; height: auto !important;
        font-family: var(--so-display-face); font-size: 1.75rem; font-weight: 700; letter-spacing: -0.01em; color: var(--so-ink) !important;
      }
      @media (min-width: 768px) { .so-amount-input { font-size: 2rem; } }
      .so-amount-input:focus { outline: none; box-shadow: none !important; }

      .so-amt-chip {
        padding: 6px 12px; border-radius: 7px; background: var(--so-surface-low); color: var(--so-ink);
        font-family: var(--so-mono); font-size: 0.78rem; box-shadow: inset 1px 1px 0 rgba(255,255,255,0.05);
        transition: background .18s, color .18s, border-color .18s; border: 1px solid transparent;
      }
      .so-amt-chip:hover { background: var(--so-surface-high); }
      .so-amt-chip.is-active { background: color-mix(in oklab, var(--primary-orange) 14%, transparent); color: var(--so-primary); border-color: var(--so-primary); }

      .so-panel-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-top: 20px; border-top: 1px solid var(--so-outline); flex-wrap: wrap; }
      .so-hint { font-size: 0.78rem; color: var(--so-primary); }
      .so-cta {
        display: inline-flex; align-items: center; gap: 8px;
        padding: 13px 26px; border-radius: 999px; white-space: nowrap;
        background: var(--so-action); color: #fff;
        font-family: var(--so-mono); font-size: 0.8rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase;
        box-shadow: 0 0 20px color-mix(in oklab, var(--primary-orange) 30%, transparent);
        transition: transform .15s, filter .2s, opacity .2s;
      }
      .so-cta:hover:not(:disabled) { filter: brightness(1.05); transform: scale(0.98); }
      .so-cta:disabled { opacity: .4; box-shadow: none; }

      .so-ticket { position: relative; background: var(--so-paper); color: var(--so-paper-ink); border-radius: 16px; overflow: hidden; box-shadow: 0 30px 70px -30px rgba(0,0,0,0.75); }
      .so-ticket-head { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; border-bottom: 1px dashed color-mix(in oklab, var(--so-paper-ink) 20%, transparent); }
      .so-ticket-eyebrow { font-family: var(--so-mono); font-size: 0.66rem; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: var(--so-action); }
      .so-restart { display: inline-flex; align-items: center; gap: 5px; font-size: 0.75rem; color: var(--so-paper-mut); }
      .so-restart:hover { color: var(--so-paper-ink); }
      .so-ticket-body { padding: 20px; }
      .so-bank-badge { display:inline-flex; align-items:center; justify-content:center; width: 40px; height: 40px; border-radius: 10px; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.12); flex-shrink: 0; }
      .so-ticket-card { font-family: var(--so-display-face); font-size: 1.2rem; font-weight: 700; letter-spacing: -0.01em; line-height: 1.15; }
      @media (min-width: 768px) { .so-ticket-card { font-size: 1.4rem; } }
      .so-ticket-bank { font-family: var(--so-mono); font-size: 0.66rem; letter-spacing: 0.06em; text-transform: uppercase; color: var(--so-paper-mut); }
      .so-savings { margin-top: 20px; }
      .so-savings-label { font-family: var(--so-mono); font-size: 0.64rem; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: var(--so-paper-mut); }
      .so-savings-amt { font-size: 2.6rem; line-height: 1; font-weight: 600; margin-top: 4px; color: var(--so-paper-ink); letter-spacing: -0.02em; }
      @media (min-width: 768px) { .so-savings-amt { font-size: 3.4rem; } }
      .so-savings-rate { display: inline-flex; align-items: center; gap: 5px; margin-top: 8px; font-size: 0.82rem; font-weight: 600; color: oklch(0.52 0.15 150); }
      .so-route { display: inline-flex; align-items: center; gap: 5px; padding: 5px 10px; border-radius: 999px; background: color-mix(in oklab, var(--primary-orange) 14%, transparent); color: var(--so-action); font-family: var(--so-mono); font-size: 0.62rem; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; white-space: nowrap; }

      .so-perf { position: relative; height: 0; border-top: 2px dashed color-mix(in oklab, var(--so-paper-ink) 24%, transparent); margin: 0 18px; }
      .so-notch { position: absolute; top: -10px; width: 20px; height: 20px; border-radius: 999px; background: var(--so-bg); }
      .so-notch-l { left: -28px; } .so-notch-r { right: -28px; }

      .so-stub { padding: 18px 20px 20px; }
      .so-instruction { font-size: 0.9rem; line-height: 1.5; color: color-mix(in oklab, var(--so-paper-ink) 85%, white); }
      .so-instruction-tag { display: inline-block; margin-right: 8px; padding: 2px 7px; border-radius: 5px; background: var(--so-paper-ink); color: var(--so-paper); font-family: var(--so-mono); font-size: 0.58rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; vertical-align: 1px; }
      .so-capnote { margin-top: 10px; font-family: var(--so-mono); font-size: 0.68rem; color: var(--so-paper-mut); }

      .so-ticket--loading { min-height: 300px; }
      .so-skel, .so-skel-dark { border-radius: 8px; background-size: 200% 100%; animation: so-shimmer 1.3s ease infinite; }
      .so-skel { background: linear-gradient(90deg, var(--so-surface-low), var(--so-surface-high), var(--so-surface-low)); }
      .so-skel-dark { background: linear-gradient(90deg, rgba(62,44,39,0.06), rgba(62,44,39,0.14), rgba(62,44,39,0.06)); }
      @keyframes so-shimmer { to { background-position: -200% 0; } }

      .so-notice, .so-upside { margin-top: 16px; padding: 13px 16px; border-radius: 12px; border: 1px solid var(--so-outline); background: var(--so-surface-low); font-size: 0.82rem; line-height: 1.45; color: var(--so-ink-variant); text-align: center; }
      .so-notice { border-color: color-mix(in oklab, var(--primary-orange) 40%, transparent); }

      .so-compare { margin-top: 16px; border: 1px solid var(--so-outline); border-radius: 14px; background: var(--so-surface-low); overflow: hidden; }
      .so-compare-toggle { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 15px 18px; font-size: 0.85rem; color: var(--so-ink); }
      .so-compare-body { border-top: 1px solid var(--so-outline); padding: 6px; }
      .so-compare-head { display: grid; grid-template-columns: 1.5fr 1fr 1fr; gap: 8px; padding: 8px 12px; font-family: var(--so-mono); font-size: 0.6rem; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; color: var(--so-mut); }
      .so-compare-row { display: grid; grid-template-columns: 1.5fr 1fr 1fr; align-items: center; gap: 8px; padding: 11px 12px; border-radius: 9px; }
      .so-compare-row.is-best { background: color-mix(in oklab, var(--primary-orange) 12%, transparent); }
      .so-best-tag { font-family: var(--so-mono); font-size: 0.58rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--so-action); }
      /* Brand attribution under a voucher figure — without it, a high number on a
         category-wide query reads as a promise the user can't act on. */
      .so-via { margin-top: 2px; font-size: 0.58rem; line-height: 1.2; color: var(--so-mut); opacity: 0.85; overflow-wrap: anywhere; }
      .so-compare-note { padding: 10px 12px 6px; font-size: 0.72rem; line-height: 1.5; color: var(--so-mut); }
      .so-compare-note b { color: var(--so-ink); }

      .so-reveal { animation: so-rise .5s cubic-bezier(.2,.7,.3,1) both; }
      @keyframes so-rise { from { opacity: 0; transform: translateY(14px) scale(.985); } to { opacity: 1; transform: none; } }

      @media (prefers-reduced-motion: reduce) {
        .so-reveal, .so-dot, .so-skel, .so-skel-dark { animation: none !important; transition: none !important; }
      }
    `}</style>
  );
}
