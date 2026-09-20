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
  ExternalLink,
  LayoutGrid,
  Store,
  X,
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
import {
  useGetPortalsQuery,
  useLazyGetGiftorsByCardSlugQuery,
} from "@/store/admin";
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
  categoryLabel,
  OTHER_SPEND,
  quickMerchants,
  TOP_CATEGORIES,
  MAX_SELECTED,
  AMOUNT_CHIPS,
  merchantKey,
  merchantLabel,
  type OptimizedCardResult,
  type PortalOption,
} from "./data";
import {
  buildInstruction,
  type Instruction as InstructionData,
  type Segment,
  type VoucherPortal,
} from "./instruction";
import type {
  MerchantBreakdown,
  MerchantOption,
} from "@/lib/logic/advisor/merchantBreakdown";

type Status = "idle" | "loading" | "done";
type Mode = "category" | "merchant";

/**
 * What the swipe CTA can offer, narrowest first. Kept as one value rather than
 * a pair of booleans so the button, its label and its click handler can never
 * disagree about which case they are in.
 */
type SwipeTarget =
  | { kind: "linked"; name: string; url: string }
  | { kind: "named"; name: string; url: null }
  | { kind: "unknown"; name: null; url: null };

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
  // Voucher partners are per-bank and only needed once the user commits to the
  // voucher route, so they're fetched lazily on click rather than up front.
  const [giftorsByCardSlug, { isFetching: isGiftorLoading }] =
    useLazyGetGiftorsByCardSlugQuery();

  // --- inputs ---
  const [selected, setSelected] = useState<string[]>([]);
  const [cardsOpen, setCardsOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("category");
  const [category, setCategory] = useState("online-shopping");
  const [merchantValue, setMerchantValue] = useState("");
  const [amount, setAmount] = useState("5000");

  // "More" tiles hand off to the precision panel: switch tab, then open that
  // tab's input. The category Select is controlled so it can be popped open;
  // the merchant searchbox has no imperative API, so we focus its input.
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [pendingFocus, setPendingFocus] = useState<Mode | null>(null);

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
    // Bank voucher portals for the scored cards, keyed by card slug. Lets the
    // instruction name where a voucher is bought ("via ICICI iShop") instead of
    // saying "your bank portal"; absent for banks with no giftor on file.
    voucherPortals: {} as Record<string, VoucherPortal>,
    // Top merchants per lane for each scored card, for the explore panel.
    // Empty on a merchant-specific run — there's nothing left to explore.
    merchantBreakdowns: {} as Record<string, MerchantBreakdown>,
  });

  // Explore panel, keyed by nothing: only one card's panel is open at a time
  // (it slides over the ticket), so a boolean is enough.
  const [exploring, setExploring] = useState(false);
  // Which card the ticket shows, when the user has promoted one from the
  // comparison table. null = show the winner.
  const [shownCardId, setShownCardId] = useState<string | null>(null);

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

  // The searchbox only needs a name, but the result CTA needs somewhere to send
  // the user — so the portal rows are also kept whole.
  //
  // Keyed by `merchantKey` rather than the raw lowercased name, and indexed
  // under both the portal's name and its slug, because two different callers
  // look rows up here with two different vocabularies: the searchbox writes a
  // display name into `merchantValue`, while `directMerchant` arrives from the
  // engine as a rule slug. Keying on the name alone silently failed for every
  // merchant whose slug and name differ by punctuation.
  //
  // Name is inserted after slug so that on a collision the display name wins —
  // it is the field the searchbox round-trips.
  const portalsByName = useMemo(() => {
    const map = new Map<string, PortalOption>();
    for (const p of (portals ?? []) as (PortalProps & { _id: string })[]) {
      const row: PortalOption = {
        _id: p._id,
        name: p.name,
        slug: p.slug,
        affiliateLink: p.affiliateLink,
        websiteUrl: p.websiteUrl,
      };
      if (p.slug) map.set(merchantKey(p.slug), row);
      map.set(merchantKey(p.name), row);
    }
    return map;
  }, [portals]);

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

  // The category an unknown merchant is scored as. Whatever `category` happens
  // to hold is a leftover from the last run or the last merchant, and scoring a
  // Radisson stay as "hotels" only by accident — or a hardware shop as "hotels"
  // because hotels was picked earlier — quotes a rate the purchase would never
  // earn. With nothing on file for the merchant, the honest answer is the
  // catch-all: every card at its own base rate.
  const effectiveCategory = merchantIsUnknown ? OTHER_SPEND.value : category;

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

  const best = results[0];
  // The card the ticket is showing. Defaults to the winner; the comparison
  // table can promote any other scored card into it. Held as a slug rather than
  // an index so a re-run (which reorders results) can't silently point the
  // ticket at a different card than the user picked.
  const shown = results.find((c) => c.cardId === shownCardId) ?? best;
  const isShowingBest = !!best && shown?.cardId === best.cardId;
  const runnerUp = results[1];
  const worst = results[results.length - 1];
  const upside =
    best && worst ? best.bestSavingsInInr - worst.bestSavingsInInr : 0;

  // Re-run scoped to a merchant chosen in the explore panel. The panel lists
  // rule merchant slugs; `runFor` takes a display label and re-slugifies it
  // server-side, and `merchantLabel` is the exact inverse of that slugify for
  // these values, so the round-trip is lossless.
  // `ranWith.category` already holds the UI category value the run was made
  // with, which is exactly what `runFor` expects.
  function handlePickMerchant(slug: string) {
    setExploring(false);
    // Stay on the card whose panel this was opened from.
    runFor(ranWith.category, merchantLabel(slug), shown?.cardId);
  }

  // Only present on a category-wide run, and only when the card has rules.
  // Suppressed when both lanes came back empty (12-21% of cards, depending on
  // category): an "Other options" button that opens an empty drawer is worse
  // than no button at all.
  const shownBreakdown = useMemo(() => {
    if (!shown) return null;
    const bd = ranWith.merchantBreakdowns[shown.cardId];
    if (!bd || bd.voucher.length + bd.swipe.length === 0) return null;
    return bd;
  }, [shown, ranWith.merchantBreakdowns]);

  const ranCategory = useMemo(
    () => categoryLabel(ranWith.category),
    [ranWith.category],
  );

  // What the result is scoped to. A matched merchant is the narrower, more
  // useful fact, so it wins; otherwise the category. `merchantMatched` guards
  // against labelling the ticket with a merchant the rules never recognised —
  // that run silently fell back to category-wide, and there is already a notice
  // below saying so.
  const scopeLabel =
    ranWith.merchant && ranWith.merchantMatched
      ? ranWith.merchant
      : ranCategory;

  // Where the swipe CTA should send the user, in three tiers.
  //
  // Resolved off `ranWith`, not the live `merchantValue`: the results belong to
  // the merchant the run was made with, and editing the field mid-result would
  // otherwise point the CTA at a site the numbers aren't about.
  //
  // The merchant is whichever the swipe figure actually earns through — the one
  // the user named, or, on a category run, the channel the winning rule is tied
  // to (`directMerchant`, which the engine leaves null when the category floor
  // won and the rate is genuinely category-wide). Knowing that name is not the
  // same as being able to link to it: ~158 of 677 active rule merchants have no
  // `portals` row at all, including `ishop`, which carries 64 active rules. So
  // "named" and "linkable" are tracked separately and the CTA degrades:
  //
  //   linked   — name + url. "Pay at Marks & Spencer", opens the site.
  //   named    — name, no url. States where the rate applies; opens the
  //              merchant picker instead of a dead tab.
  //   unknown  — no merchant. Asks the user to name one.
  const swipeTarget = useMemo((): SwipeTarget => {
    const slug = shown?.directMerchant ?? null;
    const name = ranWith.merchant || (slug ? merchantLabel(slug) : null);
    if (!name) return { kind: "unknown", name: null, url: null };

    // Look the portal up by whichever token we have. `ranWith.merchant` is a
    // display name, `directMerchant` a rule slug; `merchantKey` folds both.
    const portal = portalsByName.get(merchantKey(ranWith.merchant || slug!));
    const url = portal?.affiliateLink || portal?.websiteUrl || null;
    return url
      ? { kind: "linked", name: portal?.name ?? name, url }
      : { kind: "named", name, url: null };
  }, [ranWith.merchant, shown?.directMerchant, portalsByName]);

  // Shared by both CTAs so the two events carry identical card/context props.
  const actionProps = useCallback(
    (card: OptimizedCardResult, savingsAmount: number) => ({
      cardId: card.cardId,
      cardName: card.cardName,
      isBestCard: card.isBestCard,
      savingsAmount,
      category: ranWith.category,
      amount: ranWith.amount,
      merchant: ranWith.merchant,
    }),
    [ranWith.category, ranWith.amount, ranWith.merchant],
  );

  const handleBuyVoucher = useCallback(
    async (card: OptimizedCardResult) => {
      if (isGiftorLoading) return;

      track(
        EventName.SPEND_OPTIMIZER_BUY_VOUCHER_CLICKED,
        actionProps(card, card.voucherSavingsInInr),
      );

      try {
        const res = await giftorsByCardSlug(card.cardId).unwrap();
        // A bank with no giftor on file resolves to an empty list; opening the
        // undefined url would land the user on about:blank.
        const url = res?.[0]?.url;
        if (!url) {
          // Deliberately does NOT name the bank. `card.bankName` is mapped from
          // the card's `bankName` field, which holds the NETWORK ("visa",
          // "mastercard") on 306 of 308 active cards — so naming it produced
          // "No voucher partner listed for visa yet". The card name is a fact
          // we can state correctly.
          toast.error(`No voucher partner listed for ${card.cardName} yet`);
          return;
        }
        window.open(url, "_blank", "noopener,noreferrer");
      } catch {
        toast.error("Couldn't open the voucher partner. Please try again.");
      }
    },
    [giftorsByCardSlug, isGiftorLoading, track, actionProps],
  );

  // A `named` or `unknown` target has nowhere to send the user, so the click
  // opens the merchant picker instead — which is the actual next step in both
  // cases: pick a merchant and the run re-prices against it. The event still
  // fires either way, with `hasDestination` separating the two so the funnel
  // doesn't read an in-app picker open as an outbound click.
  const handleDirectSwipe = useCallback(
    (card: OptimizedCardResult) => {
      track(EventName.SPEND_OPTIMIZER_DIRECT_SWIPE_CLICKED, {
        ...actionProps(card, card.directSwipeSavingsInInr),
        hasDestination: swipeTarget.kind === "linked",
      });
      if (swipeTarget.kind === "linked") {
        window.open(swipeTarget.url, "_blank", "noopener,noreferrer");
        return;
      }
      setExploring(true);
    },
    [swipeTarget, track, actionProps],
  );

  // The picker only exists when there is a breakdown to show it. Without this
  // the unlinkable tiers would render a button whose click does nothing —
  // the dead-CTA bug in a new place. `SpendActions` falls back to plain text.
  const canPickMerchant = !!shownBreakdown;

  // On mobile the result panel sits below the inputs, so a tap on a category or
  // merchant tile appears to do nothing — the answer renders off-screen. Bring
  // it into view. Desktop keeps the two-column layout with the panel already
  // visible, so scrolling there would be disorienting; the 1024px check mirrors
  // the `.so-grid` breakpoint.
  const resultRef = useRef<HTMLDivElement>(null);
  const scrollToResultOnMobile = useCallback((smooth = true) => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(min-width: 1024px)").matches) return;
    // Wait for the skeleton to be laid out before measuring.
    requestAnimationFrame(() => {
      resultRef.current?.scrollIntoView({
        behavior:
          !smooth ||
          window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
        block: "start",
      });
    });
  }, []);

  // Jump from a "More" tile into the precision panel on the matching tab. The
  // panel only renders while status === "idle", so a run in progress is reset
  // first — otherwise the target input isn't mounted to open or focus.
  // Instant, not smooth: the dropdown is opened a frame later and Radix
  // measures the trigger's position at that moment. A smooth scroll is still
  // animating then, so the menu anchors to where the trigger *was* and lands
  // detached from it. Jumping straight there means the measurement is taken
  // against the final layout.
  const openPrecision = useCallback(
    (target: Mode) => {
      setStatus("idle");
      setMode(target);
      setPendingFocus(target);
      scrollToResultOnMobile(false);
    },
    [scrollToResultOnMobile],
  );

  // Run after the panel has committed, so the trigger/input exists.
  // Two frames, not one: the scroll above is itself deferred by a frame, so a
  // single rAF here would open the menu in the same frame the scroll is applied
  // and Radix would measure a stale trigger position. The inner frame runs
  // after the scroll has committed.
  useEffect(() => {
    if (!pendingFocus) return;
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => {
        if (pendingFocus === "category") setCategoryOpen(true);
        else
          document
            .querySelector<HTMLInputElement>("#so-merchant-search")
            ?.focus();
        setPendingFocus(null);
      });
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [pendingFocus]);

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
  async function runFor(
    runCategory: string,
    runMerchant: string,
    /**
     * Card to keep in the ticket after the re-run. A merchant picked from a
     * card's own panel is a question about THAT card ("what would SimplyCLICK
     * earn at Cleartrip?"), but the re-run re-ranks every card, so without this
     * the ticket would silently swap to whoever wins the new merchant. Absent
     * for an ordinary run, which should always land on the winner.
     */
    keepShownCardId?: string,
  ) {
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
        voucherPortals: res?.result?.voucherPortals ?? {},
        merchantBreakdowns: res?.result?.merchantBreakdowns ?? {},
      });
      // A fresh run invalidates whatever the panel was showing. The ticket
      // returns to the new winner unless the caller asked to stay on a card.
      setExploring(false);
      setShownCardId(
        keepShownCardId && cards.some((c) => c.cardId === keepShownCardId)
          ? keepShownCardId
          : null,
      );
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
      runFor(quick?.category ?? effectiveCategory, merchantValue);
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
                      className={`so-tile so-brand ${on ? "is-on" : ""}`}
                    >
                      <span
                        className={`so-brand-chip is-art${c.artOnPaper ? " on-paper" : ""}`}
                      >
                        {c.art ? (
                          <Image
                            src={c.art}
                            alt=""
                            width={34}
                            height={34}
                            className="so-brand-img"
                          />
                        ) : (
                          <c.icon className="h-4 w-4" />
                        )}
                      </span>
                      <span className="so-brand-name">{c.label}</span>
                    </button>
                  );
                })}
                <button
                  onClick={() => openPrecision("category")}
                  disabled={busy}
                  className="so-tile so-brand so-tile-more"
                >
                  <span className="so-brand-chip is-empty" aria-hidden>
                    <CirclePlus className="h-4 w-4" />
                  </span>
                  <span className="so-brand-name">More</span>
                </button>
              </div>
            </section>

            <section>
              <h3 className="so-eyecaps">Or a merchant</h3>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {quickMerchants.slice(0, -1).map((m) => (
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
                    className={`so-tile so-brand ${ranWith.merchant === m.label ? "is-on" : ""}`}
                  >
                    <span
                      className={`so-brand-chip${m.logoOnDark ? " is-inked" : ""}${m.logoBleed ? " is-bleed" : ""}${m.logoPortrait ? " is-portrait" : ""}${m.logoScale ? " is-wide" : ""}`}
                      style={
                        m.logoScale
                          ? ({
                              "--so-logo-scale": m.logoScale,
                            } as React.CSSProperties)
                          : undefined
                      }
                    >
                      {m.logo ? (
                        <Image
                          src={m.logo}
                          alt=""
                          width={34}
                          height={34}
                          className="so-brand-img"
                        />
                      ) : (
                        <span className="so-brand-initial">{m.label[0]}</span>
                      )}
                    </span>
                    <span className="so-brand-name">{m.label}</span>
                  </button>
                ))}
                <button
                  onClick={() => openPrecision("merchant")}
                  disabled={busy}
                  className="so-tile so-brand so-tile-more"
                >
                  <span className="so-brand-chip is-empty" aria-hidden>
                    <CirclePlus className="h-4 w-4" />
                  </span>
                  <span className="so-brand-name">More</span>
                </button>
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
                            ? "Wallet full. Swap one to change"
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
                        open={categoryOpen}
                        onOpenChange={setCategoryOpen}
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
                        {/* popper, not the default item-aligned: item-aligned
                            positions the menu against the *selected row* so it
                            can sit far from the field (worse the further down
                            the list the selection is — "Flights" is 5th). popper
                            anchors it to the trigger itself. */}
                        <SelectContent
                          position="popper"
                          sideOffset={6}
                          className="!max-h-[300px] w-[var(--radix-select-trigger-width)]"
                        >
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
                          id="so-merchant-search"
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
                              {merchantValue} covers a few categories. Which one is
                              this?
                            </p>
                            <Select value={category} onValueChange={setCategory}>
                              <SelectTrigger className="so-underline mt-2">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent
                                position="popper"
                                sideOffset={6}
                                className="!max-h-[300px] w-[var(--radix-select-trigger-width)]"
                              >
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
                            No {merchantValue}-specific offers yet. We&apos;ll
                            score this as <b>other spend</b> — each card at its
                            base rate.
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

            {status === "done" && shown && (
              <div className="so-reveal">
                <div className="so-ticket">
                  <div className="so-ticket-head">
                    {/* The eyebrow is a recommendation, so it must not claim
                        one for a card the user promoted themselves. The scope
                        rides alongside it: without it a merchant-specific
                        result is indistinguishable from a category-wide one,
                        and the figures below mean different things. */}
                    <span className="so-ticket-eyebrow">
                      {isShowingBest ? "Use this card" : "Viewing"}
                      {scopeLabel && (
                        <>
                          <span className="so-eyebrow-dot">·</span>
                          <span className="so-eyebrow-scope">{scopeLabel}</span>
                        </>
                      )}
                    </span>
                    {isShowingBest ? (
                      <button onClick={reset} className="so-restart">
                        <ArrowLeft className="h-3.5 w-3.5" /> Start over
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setShownCardId(null);
                          setExploring(false);
                        }}
                        className="so-restart"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" /> Best card
                      </button>
                    )}
                  </div>

                  <div className="so-ticket-body">
                    <div className="flex items-center gap-3">
                      <span className="so-bank-badge">
                        <Image
                          width={22}
                          height={22}
                          src={`/icons/banks/${bankIcon?.[shown.bankName] ?? bankIcon?.default}`}
                          alt=""
                        />
                      </span>
                      <div className="min-w-0">
                        <div className="so-ticket-card truncate">
                          {shown.cardName}
                        </div>
                        <div className="so-ticket-bank">{shown.bankName}</div>
                      </div>
                      {shownBreakdown && (
                        <button
                          onClick={() => setExploring(true)}
                          className="so-explore-btn ml-auto"
                          aria-expanded={exploring}
                        >
                          <LayoutGrid className="h-3 w-3" />
                          Other options
                        </button>
                      )}
                    </div>

                    <div className="so-savings">
                      {/* The route sits with the figure it describes: "You keep
                          ₹1,800" is only actionable once you know whether that
                          means swiping or buying a voucher first. */}
                      <div className="so-savings-label">
                        <span>You keep</span>
                        <span className="so-eyebrow-dot">·</span>
                        <RouteBadge route={shown.bestRoute} />
                      </div>
                      <div className="so-savings-amt so-mono">
                        {inr(shown.bestSavingsInInr)}
                      </div>
                      <div className="so-savings-rate">
                        <TrendingUp className="h-3.5 w-3.5" />
                        {shown.bestRatePct.toFixed(1)}% back on{" "}
                        {inr(ranWith.amount)}
                      </div>
                    </div>
                  </div>

                  <div className="so-perf" aria-hidden>
                    <span className="so-notch so-notch-l" />
                    <span className="so-notch so-notch-r" />
                  </div>

                  <div className="so-stub">
                    <Instruction
                      instruction={buildInstruction(
                        shown,
                        ranWith.merchant,
                        ranWith.voucherPortals[shown.cardId] ?? null,
                      )}
                    />

                    <SpendActions
                      card={shown}
                      swipeTarget={swipeTarget}
                      canPickMerchant={canPickMerchant}
                      isVoucherLoading={isGiftorLoading}
                      onBuyVoucher={() => handleBuyVoucher(shown)}
                      onDirectSwipe={() => handleDirectSwipe(shown)}
                    />
                  </div>

                  {shownBreakdown && (
                    <ExplorePanel
                      open={exploring}
                      breakdown={shownBreakdown}
                      amount={ranWith.amount}
                      cardRoute={shown.bestRoute}
                      cardMerchant={
                        shown.bestRoute === "voucher"
                          ? shown.voucherMerchant
                          : shown.directMerchant
                      }
                      onClose={() => setExploring(false)}
                      onPick={handlePickMerchant}
                    />
                  )}
                </div>

                {!ranWith.merchantMatched && ranWith.merchant && (
                  <p className="so-notice">
                    We don&apos;t have {ranWith.merchant}-specific offers yet.{" "}
                    {ranWith.category === OTHER_SPEND.value
                      ? "This is the best card on base rewards alone."
                      : `This is the best card for ${(ranCategory ?? "").toLowerCase()} overall.`}
                  </p>
                )}

                {ranWith.unsupportedCards.length > 0 && (
                  <p className="so-notice">
                    We couldn&apos;t score{" "}
                    {ranWith.unsupportedCards.length === 1
                      ? "1 of your selected cards"
                      : `${ranWith.unsupportedCards.length} of your selected cards`}{" "}
                    because we don&apos;t have reward data for{" "}
                    {ranWith.unsupportedCards.map(merchantLabel).join(", ")} yet.
                  </p>
                )}

                {/* Always about the BEST card, never the promoted one —
                    "picking this" next to a weaker card the user is merely
                    inspecting would credit it with the winner's upside. */}
                {isShowingBest && upside > 0 && (
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

                {!isShowingBest && best && (
                  <p className="so-upside">
                    You&apos;re viewing {shown.cardName}.{" "}
                    <button
                      onClick={() => {
                        setShownCardId(null);
                        setExploring(false);
                      }}
                      className="so-upside-link"
                    >
                      {best.cardName}
                    </button>{" "}
                    {/* Cards can tie on rupees — "+₹0 more" would be absurd. */}
                    {best.bestSavingsInInr > shown.bestSavingsInInr ? (
                      <>
                        earns{" "}
                        <span className="so-mono so-accent font-semibold">
                          +{inr(best.bestSavingsInInr - shown.bestSavingsInInr)}
                        </span>{" "}
                        more.
                      </>
                    ) : (
                      "earns the same here."
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
                          className={`so-compare-row ${c.isBestCard ? "is-best" : ""} ${
                            c.cardId === shown?.cardId ? "is-shown" : ""
                          }`}
                        >
                          <div className="so-compare-card">
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
                            {/* Promotes this card into the ticket above. Hidden
                                until hover/focus so the table stays readable,
                                and absent for the card already displayed. */}
                            {c.cardId !== shown?.cardId && (
                              <button
                                onClick={() => {
                                  setShownCardId(c.cardId);
                                  setExploring(false);
                                  // On mobile the ticket sits above the table,
                                  // so the promoted card would update offscreen.
                                  scrollToResultOnMobile();
                                }}
                                className="so-pick-card"
                              >
                                View card
                              </button>
                            )}
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
                            via={
                              !ranWith.merchant && c.directMerchant
                                ? merchantLabel(c.directMerchant)
                                : null
                            }
                            viaTitle="Earned by paying at"
                          />
                        </div>
                      ))}
                      <p className="so-compare-note">
                        <b>Voucher</b>: buy a brand gift card via your bank
                        portal, then pay. <b>Swipe</b>: pay directly. We bold
                        whichever earns more.
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

/**
 * The two ways to act on the winning card, ranked by what the engine actually
 * recommends: `bestRoute` takes the primary button, the other route stays
 * available as a secondary labelled with what choosing it costs.
 *
 * The swipe route is merchant-bound — the destination comes from the portal
 * record, so a category-wide run has nowhere to send the user and the button is
 * omitted rather than shown dead. When that happens on a swipe-win, the voucher
 * CTA deliberately stays secondary: promoting it would contradict the "you
 * keep ₹X" figure directly above, which is the swipe number.
 */
/** Renders one instruction segment run, bolding and linking as marked. */
function Segments({ parts }: { parts: Segment[] }) {
  return (
    <>
      {parts.map((p, i) =>
        p.href ? (
          <a
            key={i}
            href={p.href}
            target="_blank"
            rel="noopener noreferrer"
            className="so-ins-link"
          >
            {p.text}
          </a>
        ) : p.strong ? (
          <b key={i} className="so-ins-strong">
            {p.text}
          </b>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </>
  );
}

/**
 * The "Do this" block. A single step stays inline next to the tag; several
 * become a numbered list, because a voucher route is genuinely two actions
 * (buy, then pay with the balance) and running them into one sentence is what
 * made the old copy easy to misread.
 */
function Instruction({ instruction }: { instruction: InstructionData }) {
  const { steps, warning, capNote } = instruction;

  return (
    <div className="so-ins">
      {/* One flowing paragraph: the tag sits inline and the steps run on as
          sentences rather than each claiming its own row. */}
      <p className="so-instruction">
        <span className="so-instruction-tag">Do this</span>
        {steps.map((parts, i) => (
          <span key={i}>
            {i > 0 && " "}
            <Segments parts={parts} />
          </span>
        ))}
      </p>

      {(warning || capNote) && (
        <div className="so-ins-foot">
          {warning && (
            <p className="so-ins-warn is-tip">
              <TicketPercent className="h-3 w-3 shrink-0" />
              <span>{warning.text}</span>
            </p>
          )}
          {capNote && <span className="so-capnote">Cap: {capNote}</span>}
        </div>
      )}
    </div>
  );
}

/**
 * Slide-over listing the best merchants per lane for the winning card.
 *
 * Every row is a DISTINCT payout — the builder collapses ties and reports the
 * count, because these rates are very flat (most cards have 1-2 distinct rates
 * per category, and on HDFC/online_shopping 76 merchants pay identically). A
 * literal top 5 would be one real row followed by four alphabetical
 * coin-flips; "+75 more at this rate" says the same thing honestly.
 */
function ExplorePanel({
  open,
  breakdown,
  amount,
  cardRoute,
  cardMerchant,
  onClose,
  onPick,
}: {
  open: boolean;
  breakdown: MerchantBreakdown;
  amount: number;
  /** The displayed card's winning lane — not necessarily the best card's. */
  cardRoute: OptimizedCardResult["bestRoute"];
  cardMerchant: string | null;
  onClose: () => void;
  onPick: (merchant: string) => void;
}) {
  // Start on the winning route, since that's what the headline is about — but
  // fall back to the other lane when the winner's has nothing to show. Ties
  // collapse hard, so a winning lane with a single distinct payout is common
  // (Diamant/hotels: one 36% swipe rate against six identical voucher rates).
  const initialLane =
    (cardRoute === "voucher" ? breakdown.voucher : breakdown.swipe).length > 0
      ? cardRoute
      : cardRoute === "voucher"
        ? "swipe"
        : "voucher";
  const [lane, setLane] = useState<"voucher" | "swipe">(initialLane);

  useEffect(() => {
    if (open) setLane(initialLane);
  }, [open, initialLane]);

  // Escape closes, matching the overlay affordance.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const rows = lane === "voucher" ? breakdown.voucher : breakdown.swipe;

  return (
    <>
      <div
        className={`so-xp-scrim ${open ? "is-open" : ""}`}
        onClick={onClose}
        aria-hidden
      />
      <aside
        className={`so-xp ${open ? "is-open" : ""}`}
        aria-hidden={!open}
        // Keeps the closed panel out of the tab order without unmounting it,
        // so the slide transition still runs.
        inert={!open}
      >
        <div className="so-xp-head">
          <div>
            <div className="so-xp-title">Where to shop</div>
            <div className="so-xp-sub so-mono">
              on {inr(amount)} · {rows.length} of {breakdown.totalMerchants}{" "}
              merchants
            </div>
          </div>
          <button onClick={onClose} className="so-xp-close" aria-label="Close">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="so-xp-tabs" role="tablist">
          {(["voucher", "swipe"] as const).map((l) => (
            <button
              key={l}
              role="tab"
              aria-selected={lane === l}
              onClick={() => setLane(l)}
              className={`so-xp-tab ${lane === l ? "is-on" : ""}`}
            >
              {l === "voucher" ? "Voucher" : "Swipe"}
              <span className="so-xp-tab-n so-mono">
                {l === "voucher"
                  ? breakdown.voucher.length
                  : breakdown.swipe.length}
              </span>
            </button>
          ))}
        </div>

        <div className="so-xp-body">
          {rows.length === 0 ? (
            <p className="so-xp-empty">
              This card has no {lane === "voucher" ? "voucher" : "direct swipe"}{" "}
              route in this category.
            </p>
          ) : (
            <ul className="so-xp-list">
              {rows.map((r) => (
                <MerchantRow
                  key={r.merchant}
                  option={r}
                  isWinner={lane === cardRoute && r.merchant === cardMerchant}
                  onPick={() => onPick(r.merchant)}
                />
              ))}
            </ul>
          )}
          <p className="so-xp-note">
            Figures are for this exact amount, with caps applied. Pick a merchant
            to re-run the comparison across all your cards.
          </p>
        </div>
      </aside>
    </>
  );
}

function MerchantRow({
  option,
  isWinner,
  onPick,
}: {
  option: MerchantOption;
  isWinner: boolean;
  onPick: () => void;
}) {
  return (
    <li>
      <button onClick={onPick} className={`so-xp-row ${isWinner ? "is-win" : ""}`}>
        <span className="so-xp-row-main">
          <span className="so-xp-merch">{merchantLabel(option.merchant)}</span>
          {isWinner && <span className="so-xp-badge">Picked</span>}
        </span>
        <span className="so-xp-row-val">
          <span className="so-mono so-xp-amt">{inr(option.savingsInInr)}</span>
          <span className="so-mono so-xp-pct">
            {option.ratePct.toFixed(1)}%
          </span>
        </span>
      </button>
    </li>
  );
}

function SpendActions({
  card,
  swipeTarget,
  canPickMerchant,
  isVoucherLoading,
  onBuyVoucher,
  onDirectSwipe,
}: {
  card: OptimizedCardResult;
  swipeTarget: SwipeTarget;
  canPickMerchant: boolean;
  isVoucherLoading: boolean;
  onBuyVoucher: () => void;
  onDirectSwipe: () => void;
}) {
  const voucherWins = card.bestRoute === "voucher";
  // A zero here is the engine saying this card has no voucher route for the
  // query at all (laneView returns undefined and the lane prices at 0), not a
  // voucher that happens to earn nothing — the comparison table renders the
  // same field as a dash. Offering the CTA anyway sent the user to the bank's
  // gift-card portal to buy something we'd just priced at nothing.
  const hasVoucherRoute = card.voucherSavingsInInr > 0;
  // What the runner-up route gives up. Only meaningful next to the route it is
  // losing to, so it needs both buttons on screen — alone on a lone voucher CTA
  // it reads as a charge or a discount rather than a comparison. Also hidden
  // when the gap is zero or negative, where it would be noise.
  const delta =
    swipeTarget.kind !== "unknown" && hasVoucherRoute
      ? Math.round(
          Math.abs(card.voucherSavingsInInr - card.directSwipeSavingsInInr),
        )
      : 0;
  // "Pay at X" promises a destination, so it is reserved for the linked tier.
  // A named-but-unlinkable merchant still gets its name in front of the user —
  // that is the actionable fact — but phrased as the question the click
  // actually answers, since the button opens the picker rather than the site.
  const swipeLabel =
    swipeTarget.kind === "linked"
      ? `Pay at ${swipeTarget.name}`
      : swipeTarget.kind === "named"
        ? `Best at ${swipeTarget.name}`
        : "Got a merchant in mind?";

  const voucher = hasVoucherRoute ? (
    <button
      onClick={onBuyVoucher}
      disabled={isVoucherLoading}
      className={voucherWins ? "so-act so-act-primary" : "so-act so-act-secondary"}
    >
      <TicketPercent className="h-3.5 w-3.5" />
      {isVoucherLoading ? "Opening…" : "Buy voucher"}
      {!voucherWins && delta > 0 && (
        <span className="so-act-delta so-mono">−{inr(delta)}</span>
      )}
    </button>
  ) : null;

  // The swipe route now holds its slot in every tier. It used to be dropped
  // whenever no URL resolved, which on a category run left the LOSING voucher
  // route as the only button on screen — reading as the recommendation while
  // contradicting the swipe figure directly above it.
  //
  // The one case with no click worth offering is an unlinkable merchant with no
  // picker to fall back on: that states the fact as text, since the name is
  // still the useful part — it tells the user where the rate applies.
  const swipeIsInert = swipeTarget.kind !== "linked" && !canPickMerchant;

  const swipe = swipeIsInert ? (
    swipeTarget.kind === "named" ? (
      <p className="so-act-note">
        Best rate is at <strong>{swipeTarget.name}</strong>.
      </p>
    ) : null
  ) : (
    <button
      onClick={onDirectSwipe}
      className={
        voucherWins ? "so-act so-act-secondary" : "so-act so-act-primary"
      }
    >
      {swipeTarget.kind === "linked" ? (
        <ExternalLink className="h-3.5 w-3.5" />
      ) : (
        <Store className="h-3.5 w-3.5" />
      )}
      {swipeLabel}
      {voucherWins && delta > 0 && (
        <span className="so-act-delta so-mono">−{inr(delta)}</span>
      )}
    </button>
  );

  return (
    <div className="so-actions">
      {voucherWins ? (
        <>
          {voucher}
          {swipe}
        </>
      ) : (
        <>
          {swipe}
          {voucher}
        </>
      )}
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
  viaTitle = "Voucher bought for",
}: {
  value: number;
  amount: number;
  highlight: boolean;
  /** Brand this figure is earned through, shown so the number is interpretable. */
  via?: string | null;
  /** Tooltip prefix — the two lanes earn through a brand in different ways. */
  viaTitle?: string;
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
        <div className="so-via" title={`${viaTitle} ${via}`}>
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

      /* Radix locks body scroll when the category Select opens and pads the
         body to replace the removed scrollbar — a sideways jump of the whole
         page. Reserving the gutter up front makes that compensation a no-op. */
      html { scrollbar-gutter: stable; }

      .so-tile {
        display: flex; align-items: center; justify-content: center;
        height: 62px; padding: 0 10px; border-radius: 12px;
        background: var(--so-surface-low); color: var(--so-ink);
        box-shadow: inset 1px 1px 0 rgba(255,255,255,0.05);
        border: 1px solid transparent; cursor: pointer;
        transition: background .2s, border-color .2s, color .2s, transform .12s;
      }
      .so-tile:hover:not(:disabled) { background: var(--so-surface-high); color: var(--so-primary); transform: translateY(-1px); }
      .so-tile.is-on { border-color: var(--so-primary); background: var(--so-surface-high); color: var(--so-primary); }
      .so-tile:disabled { opacity: .5; cursor: not-allowed; }
      /* "More" is a doorway to the precision panel, not a spend choice. It must
         stay dimensionally identical to a base tile — same box, same 1px solid
         border, same inset — so only the border colour and text tone differ. */
      .so-tile-more { border-color: rgba(255,255,255,0.18); color: var(--so-mut); }
      .so-tile-more:hover:not(:disabled) { border-color: var(--so-primary); }
      .so-tile-label { font-size: 0.85rem; text-align: center; line-height: 1.2; }

      /* Merchant tiles pin the mark to a fixed-size chip so five logos with
         wildly different aspect ratios (Amazon 120x88, Myntra 497x190,
         Flipkart 54x54) all carry equal visual weight. Without the chip they'd
         each set their own scale.

         Three tiles per row leaves ~100px each on a small phone, and a chip
         beside a label truncates "Amazon" to "Amaz…". So the mark sits ABOVE
         the name there, handing the label the tile's full width; the row form
         returns once the tile is wide enough to hold both. */
      .so-brand {
        flex-direction: column; justify-content: center; gap: 4px;
        padding: 0 4px; text-align: center;
      }
      @media (min-width: 420px) {
        .so-brand { flex-direction: row; justify-content: flex-start; gap: 8px; padding: 0 9px; text-align: left; }
      }
      .so-brand-chip {
        flex: 0 0 auto; display: grid; place-items: center; position: relative;
        /* Smaller stacked, so chip + name clear the 62px tile without crowding. */
        width: 28px; height: 28px; border-radius: 8px; overflow: hidden;
        /* Brand marks are drawn for light ground, and two of these assets bake
           in their own white/red plate. A paper chip makes that uniform. */
        background: var(--so-paper); color: var(--so-paper-mut);
        transition: background .2s;
      }
      @media (min-width: 420px) {
        .so-brand-chip { width: 34px; height: 34px; border-radius: 9px; }
      }
      /* Light-on-transparent marks (Amazon) need ink under them instead. */
      .so-brand-chip.is-inked { background: var(--so-paper-ink); }
      /* Category art is full-colour illustration, not a brand mark needing a
         light plate to sit on — it reads directly against the tile, so no chip
         background. The box still sizes and aligns it with the merchant row. */
      .so-brand-chip.is-art { background: transparent; }
      .so-brand-chip.is-art .so-brand-img { padding: 0; }
      /* Dark line-art needs the plate back, or it disappears into the tile. */
      .so-brand-chip.is-art.on-paper { background: var(--so-paper); }
      .so-brand-chip.is-art.on-paper .so-brand-img { padding: 2px; }
      .so-brand-chip.is-empty { background: transparent; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.16); color: var(--so-mut); }
      /* Absolutely positioned so object-fit resolves against the 34px chip.
         Left in grid flow, next/image's own width/height attributes size the
         box and a portrait asset (Swiggy 114x170) overflows into the corners. */
      .so-brand-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; padding: 4px; box-sizing: border-box; }
      /* ...while assets that ship their own plate fill it edge to edge, so the
         chip's radius clips the plate instead of framing it in paper. */
      .so-brand-chip.is-bleed { background: transparent; }
      .so-brand-chip.is-bleed .so-brand-img { padding: 0; object-fit: cover; }
      /* Portrait glyphs (Swiggy 114x170) fit by height, so the default padding
         is what squeezes them. Less padding lets the mark fill the chip while
         staying whole — the plate assets above are already edge to edge. */
      .so-brand-chip.is-portrait .so-brand-img { padding: 3px; }
      /* Wide wordmarks fit by width and end up tiny; scaling past the frame
         crops the asset's own baked-in margins back off. The factor is per
         asset — Amazon (120x88) clips its smile past ~1.5, Myntra (497x190)
         carries far wider margins and needs more. */
      .so-brand-chip.is-wide .so-brand-img { padding: 0; transform: scale(var(--so-logo-scale, 1.5)); }
      .so-brand-initial { font-family: var(--so-display-face); font-size: 0.95rem; font-weight: 700; color: var(--so-paper-ink); }
      /* Stacked, the label owns the full tile width, so it needs no ellipsis —
         these are short brand names and they fit outright. It sits a step down
         in size and tone so the logo leads and the name only confirms it. */
      .so-brand-name {
        font-size: 0.7rem; line-height: 1.15; letter-spacing: 0.01em;
        color: var(--so-ink-variant); min-width: 0; max-width: 100%;
      }
      /* The dimmed label would otherwise swallow the tile's hover/selected
         colour, which the name used to inherit. */
      .so-tile:hover:not(:disabled) .so-brand-name,
      .so-tile.is-on .so-brand-name { color: inherit; }
      @media (min-width: 420px) {
        /* Beside the chip the label is width-constrained. Two-word names like
           "Online shopping" wrap onto a second line rather than being clipped
           to "Online shop…"; the 62px tile has room for two lines, and the
           balanced wrap keeps the break off a one-word orphan. */
        .so-brand-name {
          font-size: 0.8rem; line-height: 1.2;
          white-space: normal; overflow-wrap: break-word; text-wrap: balance;
        }
      }
      .so-tile-more .so-brand-name { color: var(--so-mut); }
      .so-tile-more:hover:not(:disabled) .so-brand-name { color: var(--so-primary); }
      .so-tile-more:hover:not(:disabled) .so-brand-chip.is-empty { box-shadow: inset 0 0 0 1px var(--so-primary); color: var(--so-primary); }

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
      .so-ticket-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 20px; border-bottom: 1px dashed color-mix(in oklab, var(--so-paper-ink) 20%, transparent); }
      .so-ticket-eyebrow { display: inline-flex; align-items: baseline; gap: 6px; min-width: 0; flex: 0 1 auto; font-family: var(--so-mono); font-size: 0.66rem; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: var(--so-action); }
      .so-eyebrow-dot { color: color-mix(in oklab, var(--so-paper-ink) 35%, transparent); letter-spacing: 0; }
      /* Secondary to the eyebrow: the label is the heading, the scope is the
         qualifier. Truncates rather than pushing "Start over" off the row. */
      .so-eyebrow-scope { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; letter-spacing: 0.08em; color: var(--so-paper-mut); }
      .so-restart { flex-shrink: 0; display: inline-flex; align-items: center; gap: 5px; font-size: 0.75rem; color: var(--so-paper-mut); cursor: pointer; }
      .so-restart:hover { color: var(--so-paper-ink); }
      .so-ticket-body { padding: 20px; }
      .so-bank-badge { display:inline-flex; align-items:center; justify-content:center; width: 40px; height: 40px; border-radius: 10px; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.12); flex-shrink: 0; }
      .so-ticket-card { font-family: var(--so-display-face); font-size: 1.2rem; font-weight: 700; letter-spacing: -0.01em; line-height: 1.15; }
      @media (min-width: 768px) { .so-ticket-card { font-size: 1.4rem; } }
      .so-ticket-bank { font-family: var(--so-mono); font-size: 0.66rem; letter-spacing: 0.06em; text-transform: uppercase; color: var(--so-paper-mut); }
      .so-savings { margin-top: 20px; }
      .so-savings-label { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-family: var(--so-mono); font-size: 0.64rem; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: var(--so-paper-mut); }
      .so-savings-amt { font-size: 2.6rem; line-height: 1; font-weight: 600; margin-top: 4px; color: var(--so-paper-ink); letter-spacing: -0.02em; }
      @media (min-width: 768px) { .so-savings-amt { font-size: 3.4rem; } }
      .so-savings-rate { display: inline-flex; align-items: center; gap: 5px; margin-top: 8px; font-size: 0.82rem; font-weight: 600; color: oklch(0.52 0.15 150); }
      /* Plain text on the "You keep" line, not a chip: it qualifies the label it
         sits beside rather than acting as a separate control, and a filled pill
         there competed with the figure below. */
      .so-route { display: inline-flex; align-items: center; gap: 5px; color: var(--so-action); font-family: var(--so-mono); font-size: 0.64rem; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; white-space: nowrap; }

      .so-perf { position: relative; height: 0; border-top: 2px dashed color-mix(in oklab, var(--so-paper-ink) 24%, transparent); margin: 0 18px; }
      .so-notch { position: absolute; top: -10px; width: 20px; height: 20px; border-radius: 999px; background: var(--so-bg); }
      .so-notch-l { left: -28px; } .so-notch-r { right: -28px; }

      .so-stub { padding: 14px 20px 16px; }
      .so-instruction { font-size: 0.7rem; line-height: 1.45; color: color-mix(in oklab, var(--so-paper-ink) 85%, white); }
      .so-instruction-tag { display: inline-block; margin-right: 7px; padding: 1px 6px; border-radius: 5px; background: var(--so-paper-ink); color: var(--so-paper); font-family: var(--so-mono); font-size: 0.58rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; vertical-align: 1px; }
      .so-capnote { font-family: var(--so-mono); font-size: 0.6rem; color: var(--so-paper-mut); }

      /* "Do this" block. A single step keeps the tag inline with the sentence;
         a multi-step route stacks the tag above a numbered list. */
      .so-ins-strong { font-weight: 650; color: var(--so-paper-ink); }
      .so-ins-link { font-weight: 650; color: var(--so-action); text-decoration: underline; text-underline-offset: 2px; text-decoration-thickness: 1px; }
      .so-ins-link:hover { text-decoration-thickness: 2px; }
      /* The costly-mistake line. Tinted rather than loud — it sits under advice
         the user is being told to follow, so it must read as a caveat. */
      /* Warning and cap note share a row, wrapping only when cramped. */
      .so-ins-foot { margin-top: 8px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
      .so-ins-warn { flex: 1 1 auto; min-width: 0; display: flex; align-items: center; gap: 5px; padding: 5px 8px; border-radius: 6px; font-size: 0.63rem; line-height: 1.35; font-weight: 500; }
      /* A tip points at a BETTER-paying route, so it must not borrow the
         warning's alarm colour — neutral ink on a plain tint reads as a nudge. */
      .so-ins-warn.is-tip { background: color-mix(in oklab, var(--so-paper-ink) 7%, transparent); color: color-mix(in oklab, var(--so-paper-ink) 78%, white); }

      /* "Other options" opens the merchant slide-over. Sits under the route badge,
         quiet enough not to compete with the primary CTA on the stub. */
      /* Primary-toned: this is the ticket's secondary action, and as a grey outline
         it read as disabled next to the route badge. */
      .so-explore-btn { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 999px; border: 1px solid color-mix(in oklab, var(--so-action) 40%, transparent); background: color-mix(in oklab, var(--so-action) 10%, transparent); color: var(--so-action); font-family: var(--so-mono); font-size: 0.58rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; white-space: nowrap; cursor: pointer; transition: background 0.15s, border-color 0.15s; }
      .so-explore-btn:hover { background: color-mix(in oklab, var(--so-action) 18%, transparent); border-color: color-mix(in oklab, var(--so-action) 65%, transparent); }

      /* Merchant explore slide-over. Clipped by .so-ticket's overflow:hidden,
         so it reads as a drawer inside the card rather than a page-level modal.
         Half the ticket on desktop; nearly full width on phones, where 50%
         would leave the merchant names unreadable. */
      .so-xp-scrim { position: absolute; inset: 0; z-index: 4; background: color-mix(in oklab, var(--so-paper-ink) 26%, transparent); opacity: 0; pointer-events: none; transition: opacity 0.26s ease; }
      .so-xp-scrim.is-open { opacity: 1; pointer-events: auto; }
      .so-xp { position: absolute; top: 0; right: 0; bottom: 0; z-index: 5; width: 86%; display: flex; flex-direction: column; background: var(--so-paper); border-left: 1px solid color-mix(in oklab, var(--so-paper-ink) 14%, transparent); box-shadow: -18px 0 40px -24px rgba(0,0,0,0.55); transform: translateX(100%); transition: transform 0.28s cubic-bezier(0.32, 0.72, 0, 1); }
      @media (min-width: 640px) { .so-xp { width: 50%; } }
      .so-xp.is-open { transform: translateX(0); }
      @media (prefers-reduced-motion: reduce) {
        .so-xp, .so-xp-scrim { transition: none; }
      }

      .so-xp-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; padding: 14px 16px 10px; border-bottom: 1px dashed color-mix(in oklab, var(--so-paper-ink) 18%, transparent); }
      .so-xp-title { font-size: 0.82rem; font-weight: 650; color: var(--so-paper-ink); letter-spacing: -0.01em; }
      .so-xp-sub { margin-top: 2px; font-size: 0.58rem; color: var(--so-paper-mut); }
      .so-xp-close { flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 6px; color: var(--so-paper-mut); cursor: pointer; transition: background 0.15s, color 0.15s; }
      .so-xp-close:hover { background: color-mix(in oklab, var(--so-paper-ink) 9%, transparent); color: var(--so-paper-ink); }

      .so-xp-tabs { display: flex; gap: 4px; padding: 10px 16px 0; }
      .so-xp-tab { display: inline-flex; align-items: center; gap: 5px; padding: 5px 10px; border-radius: 7px; color: var(--so-paper-mut); font-size: 0.66rem; font-weight: 600; cursor: pointer; transition: background 0.15s, color 0.15s; }
      .so-xp-tab:hover { color: var(--so-paper-ink); }
      .so-xp-tab.is-on { background: var(--so-paper-ink); color: var(--so-paper); }
      .so-xp-tab-n { font-size: 0.56rem; opacity: 0.75; }

      .so-xp-body { flex: 1; overflow-y: auto; padding: 10px 12px 14px; }
      .so-xp-list { display: flex; flex-direction: column; gap: 3px; }
      .so-xp-row { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 8px 9px; border-radius: 8px; text-align: left; cursor: pointer; transition: background 0.15s; }
      .so-xp-row:hover { background: color-mix(in oklab, var(--so-paper-ink) 7%, transparent); }
      .so-xp-row.is-win { background: color-mix(in oklab, var(--so-action) 11%, transparent); }
      .so-xp-row-main { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
      .so-xp-merch { font-size: 0.7rem; font-weight: 600; color: var(--so-paper-ink); overflow-wrap: anywhere; }
      .so-xp-badge { align-self: flex-start; font-family: var(--so-mono); font-size: 0.5rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--so-action); }
      .so-xp-row-val { flex-shrink: 0; display: flex; flex-direction: column; align-items: flex-end; }
      .so-xp-amt { font-size: 0.74rem; font-weight: 650; color: var(--so-paper-ink); }
      .so-xp-pct { font-size: 0.56rem; color: var(--so-paper-mut); }
      .so-xp-empty { padding: 18px 8px; font-size: 0.68rem; line-height: 1.5; color: var(--so-paper-mut); }
      .so-xp-note { margin-top: 12px; padding: 0 2px; font-size: 0.56rem; line-height: 1.5; color: var(--so-paper-mut); }

      /* Actions sit on the ticket's paper stub, not the dark panel, so they
         carry their own palette rather than reusing .so-cta. Both buttons share
         one box — only fill and border separate the recommended route from the
         alternative, so the hierarchy reads at a glance without the secondary
         looking disabled. */
      .so-actions { display: flex; gap: 10px; margin-top: 16px; flex-wrap: wrap; }
      .so-act {
        display: inline-flex; align-items: center; justify-content: center; gap: 7px;
        flex: 1 1 auto; min-width: 0; padding: 12px 16px; border-radius: 10px;
        font-family: var(--so-mono); font-size: 0.72rem; font-weight: 600;
        letter-spacing: 0.05em; text-transform: uppercase; white-space: nowrap;
        border: 1px solid transparent; cursor: pointer;
        transition: background .18s, border-color .18s, color .18s, filter .18s, opacity .18s;
      }
      .so-act-primary { background: var(--so-action); color: #fff; }
      .so-act-primary:hover:not(:disabled) { filter: brightness(1.06); }
      /* A tinted secondary rather than a bare outline: the alternative route is
         a real, earning option, so it carries the action colour at low
         saturation — enough to read as clickable next to the filled primary
         without the two competing for the eye. */
      .so-act-secondary {
        background: color-mix(in oklab, var(--so-action) 10%, transparent);
        color: var(--so-action);
        border-color: color-mix(in oklab, var(--so-action) 32%, transparent);
      }
      .so-act-secondary:hover:not(:disabled) {
        background: color-mix(in oklab, var(--so-action) 17%, transparent);
        border-color: color-mix(in oklab, var(--so-action) 52%, transparent);
      }
      .so-act:disabled { opacity: .5; cursor: not-allowed; }
      /* The cost of taking the road not recommended. Tucked to a lighter weight
         so it annotates the label instead of competing with it. */
      .so-act-delta { font-size: 0.66rem; font-weight: 500; opacity: 0.65; letter-spacing: 0; }
      /* Stands in for the swipe button when the merchant is known but neither
         linkable nor pickable. Deliberately not button-shaped — there is
         nothing to click — but it takes the same row slot so the actions row
         keeps its shape. */
      .so-act-note {
        flex: 1 1 auto; min-width: 0; align-self: center;
        font-size: 0.78rem; line-height: 1.4; opacity: 0.75;
      }
      .so-act-note strong { font-weight: 600; opacity: 0.95; }

      .so-ticket--loading { min-height: 300px; }
      .so-skel, .so-skel-dark { border-radius: 8px; background-size: 200% 100%; animation: so-shimmer 1.3s ease infinite; }
      .so-skel { background: linear-gradient(90deg, var(--so-surface-low), var(--so-surface-high), var(--so-surface-low)); }
      .so-skel-dark { background: linear-gradient(90deg, rgba(62,44,39,0.06), rgba(62,44,39,0.14), rgba(62,44,39,0.06)); }
      @keyframes so-shimmer { to { background-position: -200% 0; } }

      .so-notice, .so-upside { margin-top: 16px; padding: 13px 16px; border-radius: 12px; border: 1px solid var(--so-outline); background: var(--so-surface-low); font-size: 0.82rem; line-height: 1.45; color: var(--so-ink-variant); text-align: center; }
      .so-notice { border-color: color-mix(in oklab, var(--primary-orange) 40%, transparent); }

      .so-compare { margin-top: 16px; border: 1px solid var(--so-outline); border-radius: 14px; background: var(--so-surface-low); overflow: hidden; }
      .so-compare-toggle { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 15px 18px; font-size: 0.85rem; color: var(--so-ink); cursor: pointer; }
      .so-compare-body { border-top: 1px solid var(--so-outline); padding: 6px; }
      .so-compare-head { display: grid; grid-template-columns: 1.5fr 1fr 1fr; gap: 8px; padding: 8px 12px; font-family: var(--so-mono); font-size: 0.6rem; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; color: var(--so-mut); }
      .so-compare-row { display: grid; grid-template-columns: 1.5fr 1fr 1fr; align-items: center; gap: 8px; padding: 11px 12px; border-radius: 9px; }
      .so-compare-row.is-best { background: color-mix(in oklab, var(--primary-orange) 12%, transparent); }
      .so-compare-row:hover { background: color-mix(in oklab, var(--so-ink) 7%, transparent); }
      .so-compare-row.is-best:hover { background: color-mix(in oklab, var(--primary-orange) 16%, transparent); }
      /* The row currently mirrored in the ticket above. */
      .so-compare-row.is-shown { box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--primary-orange) 45%, transparent); }

      .so-compare-card { position: relative; display: flex; align-items: center; gap: 8px; min-width: 0; }
      /* Hidden until the row is hovered or the button is focused, so the table
         reads as data at rest and only offers the action on approach. Kept in
         the layout (opacity, not display) so nothing shifts on hover. */
      .so-pick-card { position: absolute; right: 0; top: 50%; transform: translateY(-50%); padding: 3px 9px; border-radius: 999px; background: var(--so-primary); color: var(--so-paper-ink); font-family: var(--so-mono); font-size: 0.54rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; white-space: nowrap; cursor: pointer; opacity: 0; pointer-events: none; transition: opacity 0.15s; }
      .so-compare-row:hover .so-pick-card, .so-pick-card:focus-visible { opacity: 1; pointer-events: auto; }
      /* Touch has no hover, so the affordance would never appear. */
      @media (hover: none) {
        .so-pick-card { position: static; transform: none; opacity: 1; pointer-events: auto; margin-left: auto; }
      }
      .so-upside-link { color: var(--so-primary); font-weight: 600; text-decoration: underline; text-underline-offset: 2px; cursor: pointer; }
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
