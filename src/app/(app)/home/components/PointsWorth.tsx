import Link from "next/link";
import dayjs from "dayjs";
import { ArrowRight, Coins } from "lucide-react";
import { useAnalytics } from "@/lib/analytics/hooks/useAnalytics";
import { EventName } from "@/lib/analytics/types";
import { ROUTES } from "@/lib/constants/routes";
import type { PointsSnapshot } from "@/app/api/redemption/latest/route";
import { inr } from "./optimizerHref";

/**
 * What the user's reward points are worth, from their last check on
 * /redemption. The worst option is shown next to the best because the gap is
 * the point: the same points are worth far less spent the obvious way.
 */
const PointsWorth = ({ cards }: { cards: PointsSnapshot[] }) => {
  const { track } = useAnalytics();
  const click = (cardName: string | null) =>
    track(EventName.HOME_POINTS_CLICKED, { cardName });

  if (cards.length === 0) {
    return (
      <section className="hm-points-empty">
        <span className="hm-strip-icon"><Coins className="h-5 w-5" aria-hidden /></span>
        <span className="hm-strip-text">
          <span className="hm-strip-title">Sitting on reward points?</span>
          <span className="hm-strip-sub">
            Enter your balance and see the redemption that gets you the most for them.
          </span>
        </span>
        <Link href={ROUTES.POINTS_REDEMPTION} className="hm-strip-cta" onClick={() => click(null)}>
          Check my points <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </section>
    );
  }

  const total = cards.reduce((s, c) => s + c.best.valueInr, 0);

  return (
    <section>
      <div className="hm-section-head">
        <div>
          <h2 className="hm-h2">Your points</h2>
          <p className="hm-lede">
            Worth up to {inr(total)} if you redeem them well. Based on your last check.
          </p>
        </div>
        <Link href={ROUTES.POINTS_REDEMPTION} className="hm-link" onClick={() => click(null)}>
          Check another card <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      <div className="hm-points">
        {cards.map((c) => (
          <Link
            key={c.cardName}
            href={ROUTES.POINTS_REDEMPTION}
            className="hm-point"
            onClick={() => click(c.cardName)}
          >
            <span className="hm-point-card">
              <span className="hm-point-name">{c.cardName}</span>
              <span className="hm-point-meta">
                {c.points.toLocaleString("en-IN")} pts · checked {dayjs(c.checkedAt).format("D MMM")}
              </span>
            </span>
            <span className="hm-point-value">
              <span className="hm-point-amount">{inr(c.best.valueInr)}</span>
              <span className="hm-point-how" title={c.best.title}>via {c.best.title}</span>
              {c.worst && (
                <span className="hm-point-worst" title={`${c.worst.title}: ${inr(c.worst.valueInr)}`}>
                  Only {inr(c.worst.valueInr)} via {c.worst.title}
                </span>
              )}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default PointsWorth;
