import { ArrowRight } from "lucide-react";
import useNav from "@/lib/hooks/useNav";
import { useAnalytics } from "@/lib/analytics/hooks/useAnalytics";
import { EventName } from "@/lib/analytics/types";

const STEPS = [
  "Tell us how you spend",
  "See matches & ask anything",
  "Apply directly with the bank",
];

/**
 * Entry point to the card recommendation chat, shown when the user has no
 * recommendation yet. The fanned faces echo the wallet section above: those
 * are the cards you have, this is the one you don't yet.
 */
const FindNextCard = () => {
  const { goToChat } = useNav();
  const { track } = useAnalytics();

  return (
    <section className="hm-next">
      <div className="hm-next-copy">
        <div className="hm-eyecaps">Card Advisor</div>
        <h2 className="hm-h2 hm-next-title">Find the card that pays you more</h2>

        <ol className="hm-steps">
          {STEPS.map((s, i) => (
            <li key={s}>
              <span className="hm-step-n">{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>

        <button
          type="button"
          className="hm-btn"
          onClick={() => {
            track(EventName.HOME_WELCOME_GET_PERSONALIZED_CARD_CLICKED, {});
            goToChat();
          }}
        >
          Find my card <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div className="hm-fan" aria-hidden>
        <div className="hm-face hm-fan-card" style={{ "--hm-face": "linear-gradient(140deg, #1c2629 0%, #3e5c63 100%)" } as React.CSSProperties} />
        <div className="hm-face hm-fan-card" style={{ "--hm-face": "linear-gradient(140deg, #251f2e 0%, #54446b 100%)" } as React.CSSProperties} />
        <div className="hm-face hm-fan-card hm-fan-front">
          <div className="hm-face-top">
            <span className="hm-face-chip" />
          </div>
          <div className="hm-face-name">Your best match</div>
        </div>
      </div>
    </section>
  );
};

export default FindNextCard;
