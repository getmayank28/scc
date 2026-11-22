import Link from "next/link";
import dayjs from "dayjs";
import { ArrowRight } from "lucide-react";
import { useAnalytics } from "@/lib/analytics/hooks/useAnalytics";
import { EventName } from "@/lib/analytics/types";
import { ROUTES } from "@/lib/constants/routes";
import type { PointsSnapshot } from "@/app/api/redemption/latest/route";
import { inr } from "./optimizerHref";
import Slider from "./Slider";

const STEPS = [
  "Pick your card & enter points",
  "Compare options & their value",
  "Redeem the best one",
];

/**
 * What the user's reward points are worth, from their last check on
 * /redemption. The worst option is shown next to the best because the gap is
 * the point: the same points are worth far less spent the obvious way.
 */
const PointsWorth = ({ cards }: { cards: PointsSnapshot[] }) => {
  const { track } = useAnalytics();
  const click = (cardName: string | null) =>
    track(EventName.HOME_POINTS_CLICKED, { cardName });

  // No check yet: the same steps-and-button layout as the Card Advisor block.
  if (cards.length === 0) {
    return (
      <section className="hm-next hm-next--solo">
        <div className="hm-next-copy">
          <div className="hm-eyecaps">Reward points</div>
          <h2 className="hm-h2 hm-next-title">Sitting on reward points?</h2>
          <ol className="hm-steps">
            {STEPS.map((s, i) => (
              <li key={s}>
                <span className="hm-step-n">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
          <Link href={ROUTES.POINTS_REDEMPTION} className="hm-btn" onClick={() => click(null)}>
            Check my points <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="hm-section-head">
        <div>
          <h2 className="hm-h2">Your points</h2>
          <p className="hm-lede">
            What your points could be worth, depending on how you redeem them.
          </p>
        </div>
        <Link href={ROUTES.POINTS_REDEMPTION} className="hm-link" onClick={() => click(null)}>
          Check another card <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      <Slider className="hm-points" count={cards.length} label="Your points">
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
                {c.points.toLocaleString("en-IN")} pts · Last checked on {dayjs(c.checkedAt).format("D MMM")}
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
      </Slider>
    </section>
  );
};

export default PointsWorth;
