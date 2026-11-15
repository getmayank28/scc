import Link from "next/link";
import dayjs from "dayjs";
import { ArrowRight, Gift } from "lucide-react";
import { useAnalytics } from "@/lib/analytics/hooks/useAnalytics";
import { EventName } from "@/lib/analytics/types";
import { ROUTES } from "@/lib/constants/routes";
import { groupClaims } from "@/components/Rewards/RewardsList";
import { CAMPAIGN_PATH, CARDS, EYEBROW, HEADLINE } from "@/app/credit-card-offers/_data/festive";
import { PortraitCard } from "@/app/credit-card-offers/_components/Hero";
import type { RewardClaim } from "@/types/rewards";
import { inr } from "./optimizerHref";

const TRACK = ["Applied", "Bank approved", "Voucher ready"] as const;

/** The banner always fans this many cards, so it reads the same for everyone. */
const FAN_SIZE = 3;
/** The flagship card (largest voucher) is always in the fan. */
const FLAGSHIP_SLUG = "cashback-sbi-card-sbi-card";

/** Statuses that hold a bank's one voucher slot (see bankLock in claims.ts). */
const HOLDS_BANK = new Set(["applied", "approved", "issued"]);

/**
 * Festive cashback on home, in one of two modes:
 * - "status": a voucher ready to use or on its way. Shown high on the page,
 *   because a pending reward is the best reason to come back.
 * - "promo": the top-of-page banner for the campaign cards this user can still
 *   earn a voucher on — not already in their wallet, and from a bank they
 *   haven't claimed yet. Drawn with the banks' own card art, as on the
 *   campaign page, so the two read as one offer.
 * Each mode renders nothing when it doesn't apply.
 */
const FestiveRewards = ({
  mode,
  claims,
  walletSlugs,
}: {
  mode: "status" | "promo";
  claims: RewardClaim[];
  walletSlugs: string[];
}) => {
  const { track } = useAnalytics();
  const { ready, coming } = groupClaims(claims);

  if (mode === "status") {
    if (ready.length > 0) {
      const total = ready.reduce((s, c) => s + c.amount, 0);
      const unrevealed = ready.some((c) => !c.voucher?.revealed);
      return (
        <Link
          href={ROUTES.REWARDS}
          className="hm-strip is-ready"
          onClick={() => track(EventName.HOME_REWARDS_CLICKED, { state: "ready" })}
        >
          <span className="hm-strip-icon"><Gift className="h-5 w-5" aria-hidden /></span>
          <span className="hm-strip-text">
            <span className="hm-strip-title">{inr(total)} voucher ready to use</span>
            <span className="hm-strip-sub">
              {ready.map((c) => c.cardName).join(", ")}
              {unrevealed ? " · reveal your code in My rewards" : ""}
            </span>
          </span>
          <span className="hm-strip-cta">
            Open My rewards <ArrowRight className="h-4 w-4" aria-hidden />
          </span>
        </Link>
      );
    }

    if (coming.length > 0) {
      // groupClaims puts approved claims first: the furthest along leads.
      const lead = coming[0];
      const reached = lead.status === "approved" ? 2 : 1;
      const dueBy =
        lead.status === "approved" && lead.approvedAt
          ? dayjs(lead.approvedAt).add(48, "hour").format("D MMM")
          : null;
      return (
        <Link
          href={ROUTES.REWARDS}
          className="hm-strip"
          onClick={() => track(EventName.HOME_REWARDS_CLICKED, { state: "coming" })}
        >
          <span className="hm-strip-icon"><Gift className="h-5 w-5" aria-hidden /></span>
          <span className="hm-strip-text">
            <span className="hm-strip-title">
              {inr(lead.amount)} voucher on its way
              {coming.length > 1 ? ` · +${coming.length - 1} more` : ""}
            </span>
            <span className="hm-strip-sub">
              {lead.cardName}
              {dueBy ? ` · due by ${dueBy}` : " · waiting for the bank to approve"}
            </span>
          </span>
          <ol className="hm-track" aria-label="Voucher progress">
            {TRACK.map((step, i) => (
              <li key={step} className={i < reached ? "is-done" : ""}>
                <span className="hm-track-dot" />
                {step}
              </li>
            ))}
          </ol>
        </Link>
      );
    }
    return null;
  }

  // promo
  const lockedBanks = new Set(
    claims.filter((c) => HOLDS_BANK.has(c.status)).map((c) => c.bank),
  );
  const wallet = new Set(walletSlugs);
  const open = CARDS.filter((c) => !wallet.has(c.slug) && !lockedBanks.has(c.bank));
  if (open.length === 0) return null;
  // Copy matches the campaign page word for word, so the banner and the page
  // it opens are recognisably the same offer.
  const vouchers = CARDS.map((c) => c.voucher);
  const min = Math.min(...vouchers);
  const max = Math.max(...vouchers);
  const m = HEADLINE.match(/^(.*?)\s+(on\s+)(\d+ top credit cards)$/);

  // Three cards: the flagship, then cards still open to this user, topped up
  // from the rest of the campaign. Biggest voucher sits in the middle, in front.
  const picks = [
    ...CARDS.filter((c) => c.slug === FLAGSHIP_SLUG),
    ...open,
    ...CARDS,
  ].filter((c, i, all) => all.findIndex((x) => x.slug === c.slug) === i).slice(0, FAN_SIZE);
  const byVoucher = [...picks].sort((a, b) => b.voucher - a.voucher);
  const fan: typeof picks = [];
  byVoucher.forEach((c, i) => (i % 2 === 0 ? fan.push(c) : fan.unshift(c)));
  const mid = fan.indexOf(byVoucher[0]);

  return (
    <Link
      href={CAMPAIGN_PATH}
      className="hm-banner"
      onClick={() => track(EventName.HOME_REWARDS_CLICKED, { state: "promo" })}
    >
      <div className="hm-banner-copy">
        <div className="hm-banner-eyebrow">
          <span className="hm-banner-dot" aria-hidden /> {EYEBROW}
        </div>
        <h2 className="hm-banner-title">
          {m ? (
            <>
              {m[1]} <br />
              {m[2]}
              <span className="hm-banner-amount">{m[3]}</span>
            </>
          ) : (
            HEADLINE
          )}
        </h2>
        <p className="hm-banner-lede">
          Pick a card, apply through FiSense, and get a {inr(min)} to {inr(max)} voucher within 48
          hours of the bank confirming your card.
        </p>
        <span className="hm-btn hm-banner-cta">
          See the cards <ArrowRight className="h-4 w-4" aria-hidden />
        </span>
      </div>

      <div className="hm-banner-fan" aria-hidden>
        {fan.map((card, i) => {
          const offset = i - mid;
          const depth = Math.abs(offset);
          return (
            <div
              key={card.slug}
              className="hm-banner-card"
              style={
                {
                  "--x": `${offset * 56}%`,
                  "--y": `${depth * 8}%`,
                  "--r": `${offset * 8}deg`,
                  "--s": 1 - depth * 0.06,
                  zIndex: 10 - depth,
                } as React.CSSProperties
              }
            >
              <PortraitCard card={card} front={depth === 0} />
            </div>
          );
        })}
      </div>
    </Link>
  );
};

export default FestiveRewards;
