import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import useUserData from "@/lib/hooks/useUserData";
import { useAnalytics } from "@/lib/analytics/hooks/useAnalytics";
import { EventName } from "@/lib/analytics/types";
import { useAddCardModal } from "@/contexts/AddCardContext";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { bankIcon } from "@/lib/data/banks";
import type { CheatSheet } from "@/lib/advisor/walletCheatSheet";
import { inr, optimizerHref, pct } from "./optimizerHref";
import Mark from "./Mark";

const DEFAULT_AMOUNT = 5000;

/**
 * Fixed one-tap shortcuts. Names must match the optimizer's quick merchants
 * so they pick up the same logos and categories.
 */
const TOP_PICKS = ["Flipkart", "Amazon", "Ajio", "Myntra", "Swiggy"];

/**
 * For users with no cards the search can't answer anything (the optimizer
 * needs a wallet), so it's replaced by a faded example of a real answer —
 * same engine, one popular card — with the add-cards ask on top.
 */
const HeroExample = ({
  example,
  loading,
  onAdd,
}: {
  example: CheatSheet | null;
  /** Hold the final layout with placeholders, so nothing shifts when it lands. */
  loading: boolean;
  onAdd: () => void;
}) => {
  const card = example?.cards[0];
  const row =
    example?.rows.find((r) => r.key === "amazon" && r.best && r.best.bestRatePct > 0) ??
    example?.rows.find((r) => r.merchant && r.best && r.best.bestRatePct > 0);
  const best = row?.best;

  return (
    <div className={`hm-ghost hm-hero-ghost${loading || (card && row && best) ? "" : " is-bare"}`}>
      {loading && (
        <div className="hm-ghost-example hm-hero-example" aria-hidden>
          <Skeleton className="h-[64px] w-full rounded-2xl bg-white/[0.06]" />
          <Skeleton className="mt-2.5 h-[68px] max-w-[520px] rounded-[14px] bg-white/[0.06]" />
        </div>
      )}
      {!loading && card && row && best && (
        <div className="hm-ghost-example hm-hero-example" aria-hidden>
          <div className="hm-search">
            <Search className="hm-search-icon" />
            <span className="hm-search-merchant hm-search-static">{row.merchant}</span>
            <span className="hm-search-amount">₹ {row.amountInr.toLocaleString("en-IN")}</span>
            <span className="hm-btn">
              Find best card <ArrowRight className="h-4 w-4" />
            </span>
          </div>
          <div className="hm-hero-answer">
            <span className="hm-face-bank">
              <Image
                src={`/icons/banks/${bankIcon?.[card.bankName] ?? bankIcon?.default}`}
                alt=""
                width={22}
                height={22}
              />
            </span>
            <span className="hm-hero-answer-text">
              <span className="hm-hero-answer-label">Pay with</span>
              <span className="hm-hero-answer-card">{card.name}</span>
            </span>
            <span className="hm-hero-answer-gain">
              <span className="hm-use-rate">{pct(best.bestRatePct)}</span>
              <span className="hm-use-how">{inr(best.bestSavingsInInr)} back</span>
            </span>
            <span className="hm-ghost-tag hm-hero-tag">Example</span>
          </div>
        </div>
      )}

      <div className="hm-ghost-cta">
        <h3 className="hm-ghost-title">Get answers like this</h3>
        <p className="hm-ghost-sub">
          Add the cards you carry, then type any store. We&apos;ll tell you which one earns the most.
        </p>
        <button type="button" className="hm-btn" onClick={onAdd}>
          Add your cards <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
};

const HomeHero = ({
  loading = false,
  noCards = false,
  example = null,
  exampleLoading = false,
}: {
  /** Wallet still loading: we don't yet know which hero this user gets. */
  loading?: boolean;
  /** The wallet loaded and has nothing to score: show the example instead of the search. */
  noCards?: boolean;
  example?: CheatSheet | null;
  exampleLoading?: boolean;
}) => {
  const router = useRouter();
  const { track } = useAnalytics();
  const { openAddCard } = useAddCardModal();
  const { firstName } = useUserData();
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState(String(DEFAULT_AMOUNT));

  const numericAmount = Number(amount) || 0;
  const canSubmit = merchant.trim().length > 0 && numericAmount > 0;

  const go = (m: string, amt: number, source: "input" | "chip") => {
    track(EventName.HOME_QUICK_SPEND_SUBMITTED, {
      merchant: m,
      category: null,
      amount: amt,
      source,
    });
    router.push(optimizerHref({ merchant: m, amount: amt }));
  };

  // Until the wallet loads, show neither version: a live search box that then
  // swaps out (for users with no cards) is worse than a moment of placeholder.
  if (loading) {
    return (
      <section className="hm-hero" aria-busy="true">
        <div className="hm-eyecaps">{firstName ? `Hi ${firstName}` : "Welcome"}</div>
        <h1 className="hm-display">Which card should you pay with?</h1>
        <Skeleton className="mt-7 h-[62px] w-full rounded-2xl bg-white/[0.06]" />
        <div className="hm-chips">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[38px] w-[104px] rounded-full bg-white/[0.06]" />
          ))}
        </div>
      </section>
    );
  }

  if (noCards) {
    return (
      <section className="hm-hero">
        <div className="hm-eyecaps">{firstName ? `Hi ${firstName}` : "Welcome"}</div>
        <h1 className="hm-display">Which card should you pay with?</h1>
        <HeroExample
          example={example}
          loading={exampleLoading}
          onAdd={() => {
            track(EventName.HOME_ADD_CARDS_CLICKED, {});
            openAddCard("home_hero");
          }}
        />
      </section>
    );
  }

  return (
    <section className="hm-hero">
      <div className="hm-eyecaps">{firstName ? `Hi ${firstName}` : "Welcome back"}</div>
      <h1 className="hm-display">Which card should you pay with?</h1>

      <form
        className="hm-search"
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit) go(merchant.trim(), numericAmount, "input");
        }}
      >
        <Search className="hm-search-icon" aria-hidden />
        <input
          className="hm-search-merchant"
          value={merchant}
          onChange={(e) => setMerchant(e.target.value)}
          placeholder="Where are you paying?"
          aria-label="Where are you paying"
        />
        <label className="hm-search-amount">
          ₹
          <input
            value={amount ? Number(amount).toLocaleString("en-IN") : ""}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
            inputMode="numeric"
            aria-label="Amount in rupees"
          />
        </label>
        <button type="submit" className="hm-btn" disabled={!canSubmit}>
          Find best card <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </form>

      <div className="hm-chips">
        <span className="hm-eyecaps hm-chips-label">Top picks</span>
        {TOP_PICKS.map((m) => (
          <button
            key={m}
            type="button"
            className="hm-chip"
            // Uses whatever amount is in the box, so typing ₹20,000 then
            // tapping a pick checks ₹20,000 there.
            onClick={() => go(m, numericAmount || DEFAULT_AMOUNT, "chip")}
          >
            <Mark merchant={m} size="sm" />
            {m}
          </button>
        ))}
      </div>
    </section>
  );
};

export default HomeHero;
