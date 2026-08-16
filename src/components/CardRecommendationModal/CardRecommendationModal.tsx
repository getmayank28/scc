import Modal from "@/app/card/modal";
import Typography from "../Typography/Typography";
import { BadgeCheck, BadgeX, X } from "lucide-react";
import { BotRecommendationCreditCardProps } from "@/types/card";
import { Button } from "../ui/stateful-button";
import { trackEvent } from "@/lib/analytics/track";
import { EventName } from "@/lib/analytics/types";
import {
  displayCardName,
  feeStatus,
  formatInr,
  rewardStreamsOf,
  valueLedgerOf,
} from "@/lib/utils/cardPresentation";

/**
 * `ideal_for` / `not_ideal_for` arrive as one string with the individual
 * reasons joined by "; ". They are already a list — rendering them as a dense
 * paragraph just makes the reader do the splitting.
 */
function toReasons(text: string | undefined): string[] {
  return (text ?? "")
    .split(/;\s*/)
    .map((part) => part.trim().replace(/\.$/, ""))
    .filter(Boolean);
}

const CardRecommendationModal = ({
  open = false,
  applyLink,
  onClose,
  ...rest
}: BotRecommendationCreditCardProps & {
  open?: boolean;
  onClose: () => void;
}) => {
  const name = displayCardName(rest?.cardName);
  const fee = feeStatus(rest);
  const streams = rewardStreamsOf(rest);
  const milestones = rest?.milestones ?? [];
  const ledger = valueLedgerOf(rest);

  const whyReasons = toReasons(rest?.whyThisCard);
  const notIdealReasons = toReasons(rest?.notIdealFor);

  // Bars are sized against the largest EARNING, never a flat 100% and never
  // against a cost — a deduction is not a share of what you earn.
  const earnings = streams.filter((s) => !s.isCost);
  const costs = streams.filter((s) => s.isCost);
  const maxEarning = Math.max(1, ...earnings.map((s) => s.valueInr));

  const behindBy = rest?.lossVsBestInr ?? 0;
  const isBest = rest?.rank === 1 || behindBy === 0;

  return (
    /* The panel is capped at the viewport and lays itself out as a column:
       a scrolling body between a pinned close button and a pinned footer. It
       used to be `h-fit` with an `absolute bottom-0` footer, so on a tall card
       the box grew past the screen and took the fee and Apply button with it —
       the one row the reader needs was the first thing to be clipped. Padding
       moves onto the scroll container so the footer can sit flush. */
    <Modal
      isOpen={open}
      onClose={onClose}
      removeCloseButton
      allowOutsideClickClose={false}
      className="relative flex max-h-[90vh] flex-col overflow-hidden border-2 border-brown-border bg-brown-background p-0 max-md:mx-0 max-md:w-full max-md:min-w-0 max-md:max-w-none max-md:h-[100dvh] max-md:max-h-none max-md:rounded-none w-[800px] min-w-[800px] max-w-[80vw]"
    >
      <div
        onClick={onClose}
        className="z-40 absolute top-5 cursor-pointer right-5 bg-[#372921] w-10 h-10 max-md:w-8 max-md:h-8 rounded-full flex justify-center items-center"
      >
        <X color="#ffffff" />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-6">
      {/* Header: the figure, then the arithmetic that produces it. */}
      <div className="pr-14">
        <Typography
          variant="body"
          className="text-left font-bold opacity-100 text-white/80 text-[15px]"
        >
          {name}
        </Typography>

        {ledger ? (
          <>
            <Typography variant="h3" className="font-bold text-left mt-1.5">
              <span className="text-primary-orange [font-variant-numeric:tabular-nums]">
                {formatInr(ledger.netInr)}
              </span>{" "}
              value back a year
            </Typography>

            <p className="text-left text-[13px] text-white/50 mt-1 [font-variant-numeric:tabular-nums]">
              {rest?.returnOnSpend && `${rest.returnOnSpend}% effective return`}
              {typeof rest?.annualSpendInr === "number" &&
                rest.annualSpendInr > 0 &&
                ` on ${formatInr(rest.annualSpendInr)} of projected spend`}
            </p>

            {/* The working, shown. This is what makes the breakdown below and
                the headline above visibly the same number. */}
            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-white/60 [font-variant-numeric:tabular-nums]">
              <span className="text-white/85">
                {formatInr(ledger.earnedInr)} rewards
              </span>
              {ledger.milestoneInr > 0 && (
                <>
                  <span className="text-white/30">+</span>
                  <span className="text-white/85">
                    {formatInr(ledger.milestoneInr)} milestones
                  </span>
                </>
              )}
              {ledger.costInr > 0 && (
                <>
                  <span className="text-white/30">−</span>
                  <span className="text-white/85">
                    {formatInr(ledger.costInr)} forex
                  </span>
                </>
              )}
              {ledger.feeInr > 0 && (
                <>
                  <span className="text-white/30">−</span>
                  <span className="text-white/85">
                    {formatInr(ledger.feeInr)} fee
                  </span>
                </>
              )}
              <span className="text-white/30">=</span>
              <span className="font-bold text-primary-orange">
                {formatInr(ledger.netInr)}
              </span>
            </div>
          </>
        ) : (
          <Typography variant="h3" className="font-bold text-left my-2">
            <span className="text-primary-orange">{rest?.returnOnSpend}%</span>{" "}
            return on your annual spend
          </Typography>
        )}

        {/* How it placed. This modal is opened by a "Why this?" button, so the
            comparison against the winner is the literal question being asked. */}
        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-brown-sidebar px-3 py-1">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isBest ? "bg-primary-orange" : "bg-white/30"
            }`}
          />
          <span className="text-[12px] text-white/70 [font-variant-numeric:tabular-nums]">
            {isBest
              ? "Highest net value of your three matches"
              : `${formatInr(behindBy)} less than your best match`}
          </span>
        </div>
      </div>

      {/* Why this card — full width, because it is what the reader came for. */}
      <div className="mt-6">
        <div className="flex p-3 px-4 justify-start items-center gap-2 bg-brown-sidebar rounded-t-sm">
          <BadgeCheck size={18} color="#22C55F" />
          <Typography
            variant="caption"
            className="text-left text-sm opacity-100 font-semibold uppercase tracking-[0.5px]"
          >
            why this card
          </Typography>
        </div>
        <div className="bg-[#372921] p-4 rounded-b-sm">
          {whyReasons.length > 1 ? (
            <ul className="flex flex-col gap-2">
              {whyReasons.map((reason) => (
                <li key={reason} className="flex gap-2.5">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-primary-orange" />
                  <span className="text-sm leading-relaxed text-white/80">
                    {reason}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm leading-relaxed text-white/80">
              {rest?.whyThisCard}
            </p>
          )}
        </div>
      </div>

      {/* Where the value comes from. */}
      {streams.length > 0 && (
        <div className="mt-4">
          <div className="flex p-3 px-4 justify-start items-center gap-2 bg-brown-sidebar rounded-t-sm">
            <Typography
              variant="caption"
              className="text-left text-sm opacity-100 font-semibold uppercase tracking-[0.5px]"
            >
              Where the value comes from
            </Typography>
          </div>
          <div className="bg-[#372921] p-4 rounded-b-sm flex flex-col gap-3.5">
            {earnings.map((stream) => {
              const share = ledger?.earnedInr
                ? Math.round((stream.valueInr / ledger.earnedInr) * 100)
                : null;
              return (
                <div key={stream.label} className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-baseline gap-3">
                    <span className="text-sm text-white/80 capitalize">
                      {stream.label}
                    </span>
                    <span className="flex items-baseline gap-2 [font-variant-numeric:tabular-nums]">
                      {share !== null && (
                        <span className="text-[11px] text-white/40">
                          {share}%
                        </span>
                      )}
                      <span className="text-sm font-semibold text-white">
                        {formatInr(stream.valueInr)}
                      </span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary-orange"
                      style={{
                        width: `${Math.max(
                          2,
                          (stream.valueInr / maxEarning) * 100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}

            {/* Deductions sit below a rule, unbarred: they are subtracted from
                the total above, not a slice of it. */}
            {(costs.length > 0 || (ledger?.feeInr ?? 0) > 0) && (
              <div className="flex flex-col gap-2 border-t border-white/10 pt-3">
                {costs.map((cost) => (
                  <div
                    key={cost.label}
                    className="flex justify-between items-baseline gap-3"
                  >
                    <span className="text-sm capitalize text-white/60">
                      {cost.label}
                    </span>
                    <span className="text-sm font-semibold text-[#FF8A66] [font-variant-numeric:tabular-nums]">
                      −{formatInr(cost.valueInr)}
                    </span>
                  </div>
                ))}
                {ledger && ledger.feeInr > 0 && (
                  <div className="flex justify-between items-baseline gap-3">
                    <span className="text-sm text-white/60">Annual fee</span>
                    <span className="text-sm font-semibold text-[#FF8A66] [font-variant-numeric:tabular-nums]">
                      −{formatInr(ledger.feeInr)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* The panel resolves to the headline figure. */}
            {ledger && (
              <div className="flex justify-between items-baseline gap-3 border-t border-white/10 pt-3">
                <span className="text-sm font-semibold text-white">
                  Net value a year
                </span>
                <span className="text-base font-bold text-primary-orange [font-variant-numeric:tabular-nums]">
                  {formatInr(ledger.netInr)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Milestones your spend unlocks. */}
      {milestones.length > 0 && (
        <div className="mt-4">
          <div className="flex p-3 px-4 justify-start items-center gap-2 bg-brown-sidebar rounded-t-sm">
            <Typography
              variant="caption"
              className="text-left text-sm opacity-100 font-semibold uppercase tracking-[0.5px]"
            >
              Milestones your spend unlocks
            </Typography>
          </div>
          <div className="bg-[#372921] p-4 rounded-b-sm flex flex-col gap-3">
            {milestones.map((milestone) => (
              <div
                key={`${milestone.label}-${milestone.spendThresholdInr}`}
                className="flex justify-between items-baseline gap-3"
              >
                <span className="text-sm text-white/80 capitalize">
                  {milestone.label}
                  <span className="text-white/45 [font-variant-numeric:tabular-nums]">
                    {" "}
                    · {formatInr(milestone.spendThresholdInr)}{" "}
                    {milestone.period}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-semibold text-primary-orange [font-variant-numeric:tabular-nums]">
                  {formatInr(milestone.annualValueInr)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* The trade-off, quieter than the case for the card. */}
      {(notIdealReasons.length > 0 || rest?.notIdealFor) && (
        <div className="mt-4 rounded-sm border border-white/10 bg-brown-sidebar/40 p-4">
          <div className="flex items-center gap-2 mb-2">
            <BadgeX size={16} color="#FF8A66" />
            <span className="text-[12px] font-semibold uppercase tracking-[0.5px] text-white/60">
              Worth knowing
            </span>
          </div>
          {notIdealReasons.length > 1 ? (
            <ul className="flex flex-col gap-1.5">
              {notIdealReasons.map((reason) => (
                <li key={reason} className="flex gap-2.5">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-white/25" />
                  <span className="text-[13px] leading-relaxed text-white/60">
                    {reason}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] leading-relaxed text-white/60">
              {rest?.notIdealFor}
            </p>
          )}
        </div>
      )}
      </div>

      {/* The fee and the Apply button: a flex sibling of the scroll area, so
          they stay visible however tall the card's detail runs. */}
      <div className="shrink-0 bg-[#372921] flex justify-between items-center gap-3 p-4 max-md:gap-2 w-full">
        <div className="[font-variant-numeric:tabular-nums]">
          <span className="text-[11px] uppercase tracking-[0.5px] text-white/45">
            Annual fee
          </span>
          <p className="text-sm font-bold text-white">
            {fee.label}
            {!fee.isFree && fee.detail && (
              <span className="font-normal text-white/50">
                {" "}
                · {fee.detail}
              </span>
            )}
          </p>
        </div>
        {applyLink && (
          <Button
            className="font-bold"
            onClick={() => {
              trackEvent(EventName.CHAT_CARD_DETAIL_APPLY_CLICKED, {
                cardName: rest?.cardName ?? "",
              });
              window.open(applyLink, "_blank");
            }}
          >
            Apply
          </Button>
        )}
      </div>
    </Modal>
  );
};

export default CardRecommendationModal;
