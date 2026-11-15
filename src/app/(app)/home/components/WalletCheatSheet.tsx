import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalytics } from "@/lib/analytics/hooks/useAnalytics";
import { EventName } from "@/lib/analytics/types";
import { useAddCardModal } from "@/contexts/AddCardContext";
import { bankIcon } from "@/lib/data/banks";
import { merchantLabel } from "@/app/(app)/spend-optimizer/data";
import type { CheatSheet, CheatSheetCard, CheatSheetRow } from "@/lib/advisor/walletCheatSheet";
import { inr, optimizerHref, pct } from "./optimizerHref";
import Mark from "./Mark";
import Slider from "./Slider";

/**
 * Card-face tones, assigned by position so two cards side by side never share
 * one. Muted on purpose: the faces identify, the rates are what should pop.
 */
const FACE_TONES = [
  "linear-gradient(140deg, #2f231c 0%, #7a5236 100%)",
  "linear-gradient(140deg, #1c2629 0%, #3e5c63 100%)",
  "linear-gradient(140deg, #251f2e 0%, #54446b 100%)",
  "linear-gradient(140deg, #242424 0%, #555049 100%)",
];

/**
 * How the winning card earns it, in a few words. Category rows (flights,
 * hotels) usually win through one brand's voucher, so the brand is named —
 * otherwise the rate reads as if the whole category paid it.
 */
function howText(row: CheatSheetRow): string {
  const best = row.best!;
  if (!row.merchant && best.bestRoute === "voucher" && best.voucherMerchant) {
    return `${merchantLabel(best.voucherMerchant)} voucher`;
  }
  if (!row.merchant && best.bestRoute === "swipe" && best.directMerchant) {
    return `At ${merchantLabel(best.directMerchant)}`;
  }
  return best.bestRoute === "voucher"
    ? `${inr(best.bestSavingsInInr)} back via voucher`
    : `${inr(best.bestSavingsInInr)} back on ${inr(row.amountInr)}`;
}

interface Group {
  card: CheatSheetCard;
  rows: CheatSheetRow[];
}

/** Wins grouped under the card that earns them; busiest card first. */
function groupByCard(cards: CheatSheetCard[], rows: CheatSheetRow[]) {
  const bySlug = new Map<string, Group>();
  for (const row of rows) {
    if (!row.best || row.best.bestRatePct <= 0) continue;
    const card =
      cards.find((c) => c.slug === row.best!.cardId) ??
      ({ slug: row.best.cardId, name: row.best.cardName, bankName: row.best.bankName } as CheatSheetCard);
    const g = bySlug.get(card.slug) ?? { card, rows: [] };
    g.rows.push(row);
    bySlug.set(card.slug, g);
  }
  const groups = [...bySlug.values()].sort((a, b) => b.rows.length - a.rows.length);
  const idle = cards.filter((c) => !bySlug.has(c.slug));
  const unearned = rows.filter((r) => !r.best || r.best.bestRatePct <= 0);
  return { groups, idle, unearned };
}

/** "Tata Neu Plus HDFC Bank Credit Card" → "Tata Neu Plus HDFC Bank": the face already says it's a card. */
const faceName = (name: string) => name.replace(/\s+credit card$/i, "").trim() || name;

const CardFace = ({ card, tone }: { card: CheatSheetCard; tone: string }) => (
  <div className="hm-face" style={{ "--hm-face": tone } as React.CSSProperties}>
    <div className="hm-face-top">
      <span className="hm-face-bank">
        <Image
          src={`/icons/banks/${bankIcon?.[card.bankName] ?? bankIcon?.default}`}
          alt=""
          width={22}
          height={22}
        />
      </span>
      <span className="hm-face-chip" aria-hidden />
    </div>
    <div className="hm-face-name">{faceName(card.name)}</div>
  </div>
);

/**
 * No scoreable cards yet. Instead of an empty box, a faded example of the real
 * thing — one popular card and where it wins, scored by the same engine — with
 * the ask on top. People see the payoff before being asked to do anything.
 */
const EmptyWallet = ({
  example,
  loading,
  hasUnsupportedCards,
  onAdd,
}: {
  example: CheatSheet | null;
  /** Hold the final layout with placeholders, so nothing shifts when it lands. */
  loading: boolean;
  /** Holds cards, but none we can score yet: don't tell them to add cards. */
  hasUnsupportedCards: boolean;
  onAdd: () => void;
}) => {
  const card = example?.cards[0];
  const rows = (example?.rows ?? [])
    .filter((r) => r.merchant && r.best && r.best.bestRatePct > 0)
    .slice(0, 4);

  return (
    <div className={`hm-ghost${loading || (card && rows.length) ? "" : " is-bare"}`}>
      {loading && (
        <div className="hm-group hm-ghost-example" aria-hidden>
          <Skeleton className="aspect-[1.586] rounded-[14px] bg-white/10 max-md:h-16 max-md:aspect-auto" />
          <div className="hm-use-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[58px] rounded-xl bg-white/10" />
            ))}
          </div>
        </div>
      )}
      {!loading && card && rows.length > 0 && (
        <div className="hm-group hm-ghost-example" aria-hidden>
          <div className="hm-ghost-face">
            <CardFace card={card} tone={FACE_TONES[0]} />
            <span className="hm-ghost-tag">Example</span>
          </div>
          <div>
            <div className="hm-eyecaps hm-use-label">Use it for</div>
            <div className="hm-use-grid">
              {rows.map((row) => (
                <div key={row.key} className="hm-use">
                  <Mark merchant={row.merchant} category={row.category} />
                  <span className="hm-use-text">
                    <span className="hm-use-name block">{row.label}</span>
                    <span className="hm-use-how block">{howText(row)}</span>
                  </span>
                  <span className="hm-use-rate">{pct(row.best!.bestRatePct)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="hm-ghost-cta">
        {hasUnsupportedCards ? (
          <>
            <h3 className="hm-ghost-title">We can&apos;t score your cards yet</h3>
            <p className="hm-ghost-sub">
              We&apos;re adding them. Add another card you carry to see where each one pays most.
            </p>
            <button type="button" className="hm-btn" onClick={onAdd}>
              Manage your cards <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </>
        ) : (
          <>
            <h3 className="hm-ghost-title">See this for your own cards</h3>
            <p className="hm-ghost-sub">
              Add the cards you carry. We&apos;ll match each one to the places it pays you most.
            </p>
            <button type="button" className="hm-btn" onClick={onAdd}>
              Add your cards <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const SectionHead = ({ walletCardCount }: { walletCardCount: number }) => (
  <div className="hm-section-head">
    <div>
      <h2 className="hm-h2">Which card where</h2>
      <p className="hm-lede">
        {walletCardCount > 1
          ? `Your ${walletCardCount} cards, matched to the spends each one wins.`
          : walletCardCount === 1
            ? "Where your card earns the most on everyday spends."
            : "Which of your cards to use, wherever you pay."}
      </p>
    </div>
  </div>
);

const WalletCheatSheet = ({
  cards,
  rows,
  walletCardCount,
  example,
  exampleLoading,
  isLoading,
  isError,
  onRetry,
}: {
  cards: CheatSheetCard[];
  rows: CheatSheetRow[];
  walletCardCount: number;
  /** Example card's cheat sheet, loaded only when the wallet has nothing to show. */
  example: CheatSheet | null;
  exampleLoading: boolean;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) => {
  const { openAddCard } = useAddCardModal();
  const { track } = useAnalytics();

  if (isLoading) {
    return (
      <section>
        <SectionHead walletCardCount={walletCardCount} />
        <div className="hm-group">
          <Skeleton className="aspect-[1.586] rounded-[14px] bg-white/10 max-md:h-16 max-md:aspect-auto" />
          <div className="hm-use-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[58px] rounded-xl bg-white/10" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section>
        <SectionHead walletCardCount={walletCardCount} />
        <div className="hm-notes">
          <span>
            Couldn&apos;t load your cards.{" "}
            <button type="button" onClick={onRetry} className="underline text-[var(--hm-accent)] cursor-pointer">
              Try again
            </button>
          </span>
        </div>
      </section>
    );
  }

  if (walletCardCount === 0 || cards.length === 0) {
    return (
      <section>
        <SectionHead walletCardCount={0} />
        <EmptyWallet
          example={example}
          loading={exampleLoading}
          hasUnsupportedCards={walletCardCount > 0}
          onAdd={() => {
            track(EventName.HOME_ADD_CARDS_CLICKED, {});
            openAddCard("home_wallet");
          }}
        />
      </section>
    );
  }

  const { groups, idle, unearned } = groupByCard(cards, rows);

  return (
    <section>
      <SectionHead walletCardCount={walletCardCount} />
      <Slider className="hm-wallet" count={groups.length} label="Your cards">
        {groups.map((g, i) => (
          <div key={g.card.slug} className="hm-group">
            <CardFace card={g.card} tone={FACE_TONES[i % FACE_TONES.length]} />
            <div>
              <div className="hm-eyecaps hm-use-label">Use it for</div>
              <div className={`hm-use-grid${g.rows.length > 3 ? " is-long" : ""}`}>
                {g.rows.map((row) => (
                  <Link
                    key={row.key}
                    className="hm-use"
                    href={optimizerHref({
                      merchant: row.merchant,
                      category: row.category,
                      amount: row.amountInr,
                    })}
                    onClick={() =>
                      track(EventName.HOME_QUICK_SPEND_SUBMITTED, {
                        merchant: row.merchant,
                        category: row.category,
                        amount: row.amountInr,
                        source: "cheat_sheet",
                      })
                    }
                  >
                    <Mark merchant={row.merchant} category={row.category} />
                    <span className="hm-use-text" title={`${row.label}: ${howText(row)}`}>
                      <span className="hm-use-name block">{row.label}</span>
                      <span className="hm-use-how block">{howText(row)}</span>
                    </span>
                    <span className="hm-use-rate">{pct(row.best!.bestRatePct)}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ))}
      </Slider>

      {(idle.length > 0 || unearned.length > 0) && (
        <div className="hm-notes mt-4">
          {idle.length > 0 && (
            <span>
              <b>{idle.map((c) => c.name).join(", ")}</b>{" "}
              {idle.length === 1 ? "isn't" : "aren't"} the best pick for any of these.
            </span>
          )}
          {unearned.length > 0 && (
            <span>
              None of your cards earn rewards on{" "}
              <b>{unearned.map((r) => r.label.toLowerCase()).join(", ")}</b>.
            </span>
          )}
        </div>
      )}
    </section>
  );
};

export default WalletCheatSheet;
