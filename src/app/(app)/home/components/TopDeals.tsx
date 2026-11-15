import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowRight, ArrowUpRight, Check, Copy } from "lucide-react";
import { useAnalytics } from "@/lib/analytics/hooks/useAnalytics";
import { EventName } from "@/lib/analytics/types";
import { ROUTES } from "@/lib/constants/routes";
import { outUrl } from "@/lib/cuelinks/outUrl";
import type { Deal, MerchantDeals } from "@/types/deals";
import { pct } from "./optimizerHref";
import Mark from "./Mark";
import Slider from "./Slider";

const MAX_TILES = 6;
/**
 * Below this a card's "merchant-specific" rate is just its base rate under
 * another name — nothing worth pairing with a deal.
 */
const MIN_CARD_RATE = 2;

/**
 * Stores where one of the user's cards has a real rule for that store, best
 * rate first. Category-wide picks are left out on purpose: they often quote
 * a rate that only applies through a bank portal (ICICI's iShop 18% showing
 * up against Boat), which would be wrong here.
 */
export function pickTopDeals(merchants: MerchantDeals[]): MerchantDeals[] {
  return merchants
    .filter(
      (m) =>
        m.deals.length > 0 &&
        m.bestCard?.merchantSpecific &&
        m.bestCard.ratePct >= MIN_CARD_RATE,
    )
    .sort(
      (a, b) =>
        b.bestCard!.ratePct - a.bestCard!.ratePct ||
        (b.deals[0].discount?.percent ?? 0) - (a.deals[0].discount?.percent ?? 0),
    )
    .slice(0, MAX_TILES);
}

const DealTile = ({ m }: { m: MerchantDeals }) => {
  const { track } = useAnalytics();
  const [copied, setCopied] = useState(false);
  // The API sorts each store's deals by usefulness: codes, then biggest discount.
  const deal: Deal = m.deals[0];
  const card = m.bestCard!;
  const props = {
    surface: "home" as const,
    merchant: m.merchantName,
    offerId: deal.offerId,
    hasCode: !!deal.couponCode,
    cardId: card.cardId,
  };

  const copy = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!deal.couponCode) return;
    try {
      await navigator.clipboard.writeText(deal.couponCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      track(EventName.DEAL_CODE_COPIED, props);
    } catch {
      toast.error("Couldn't copy. Select the code instead.");
    }
  };

  return (
    <div className="hm-deal">
      <div className="hm-deal-head">
        <Mark merchant={m.merchantName} />
        <span className="hm-deal-store">{m.merchantName}</span>
        {m.deals.length > 1 && <span className="hm-deal-count">{m.deals.length} offers</span>}
      </div>

      <div className="hm-deal-body">
        {deal.discount && <div className="hm-deal-off">{deal.discount.label}</div>}
        <p className="hm-deal-title" title={deal.title}>{deal.title}</p>
      </div>

      <div className="hm-deal-card">
        <span className="hm-deal-plus">+ {pct(card.ratePct)}</span>
        <span className="hm-deal-card-text">
          back with <b>{card.cardName.replace(/\s+credit card$/i, "")}</b>
          {card.route === "voucher" ? " via voucher" : ""}
        </span>
      </div>

      <div className="hm-deal-actions">
        {deal.couponCode && (
          <button type="button" className="hm-deal-code" onClick={copy} aria-label={`Copy code ${deal.couponCode}`}>
            {deal.couponCode}
            {copied ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
          </button>
        )}
        <a
          href={outUrl({ type: "offer", id: String(deal.offerId), surface: "home", card: card.cardId })}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="hm-deal-shop"
          onClick={() => track(EventName.DEAL_CLICKED, props)}
        >
          Shop <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
        </a>
      </div>
    </div>
  );
};

const TopDeals = ({ merchants }: { merchants: MerchantDeals[] }) => {
  const top = pickTopDeals(merchants);
  if (top.length === 0) return null;

  return (
    <section>
      <div className="hm-section-head">
        <div>
          <h2 className="hm-h2">Deals for your cards</h2>
          <p className="hm-lede">Store offers running now, plus what your best card adds on top.</p>
        </div>
        <Link href={ROUTES.DEALS} className="hm-link">
          All deals <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
      <Slider className="hm-deals" count={top.length} label="Deals">
        {top.map((m) => (
          <DealTile key={m.portalSlug} m={m} />
        ))}
      </Slider>
    </section>
  );
};

export default TopDeals;
