"use client";

import { useEffect, useState } from "react";
import Typography from "@/components/Typography/Typography";
import { BotRecommendationCreditCardProps } from "@/types/card";
import CardRecommendationModal from "../CardRecommendationModal/CardRecommendationModal";
import { useLazyGetRedirectUrlQuery } from "@/store/api";
import { Spinner } from "../ui/spinner";
import { trackEvent } from "@/lib/analytics/track";
import { EventName } from "@/lib/analytics/types";
import {
  displayCardName,
  feeStatus,
  formatInr,
  formatInrCompact,
  rewardStreamsOf,
} from "@/lib/utils/cardPresentation";

function ChatCard(props: BotRecommendationCreditCardProps) {
  const [open, setOpen] = useState(false);

  const [getRedirectUrl, { data, isLoading }] = useLazyGetRedirectUrlQuery();

  useEffect(() => {
    if (props?.id) {
      getRedirectUrl({ cardId: props.id });
    }
  }, [props?.id]);

  // Prefer the resolved redirect URL; fall back to any applyLink supplied in
  // the payload (socket recommendations carry real URLs, local cards send "").
  const applyLink = data?.data || props?.applyLink || "";

  const name = displayCardName(props?.cardName);
  const fee = feeStatus(props);
  const streams = rewardStreamsOf(props);

  // Bars are sized against total earnings; costs (forex markup) are listed but
  // never charted as if they were a share of what you earn.
  const earningsTotal = streams
    .filter((s) => !s.isCost)
    .reduce((sum, s) => sum + s.valueInr, 0);

  // The headline. `netAnnualValueInr` is what the engines actually rank on, so
  // it is what the card leads with — the old "annual loss" headline rendered as
  // a bare "0" on the winning card, burying the number that sells it.
  const netValue = props?.netAnnualValueInr;
  const hasNetValue = typeof netValue === "number" && netValue > 0;

  const isBest = props?.rank === 1 || props?.lossVsBestInr === 0;

  const milestone = props?.milestones?.at(0);

  return (
    <div
      className={`w-[220px] max-w-[220px] max-md:w-full max-md:max-w-full shadow-sm overflow-visible rounded-lg relative flex flex-col
        bg-[linear-gradient(135deg,#30251E_60%,#6F4D34_100%,#AD744A_100%)]
        ${isBest ? "border-2 border-primary-orange" : "border border-brown-border"}`}
    >
      {/* Rank. The engines sort by net return, so 01/02/03 encodes real
          order — and set large and ghosted it reads as embossing, which is the
          subject's own vernacular. Decorative here: the badge carries the
          meaning for screen readers, and the detail modal states the gap. */}
      {props?.rank && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-2 top-1 select-none font-hubot text-[40px] font-bold leading-none text-white/[0.06] [font-variant-numeric:tabular-nums]"
        >
          {String(props.rank).padStart(2, "0")}
        </span>
      )}

      {/* The badge is absolutely positioned so it costs the row no height —
          only one card in three carries it, and a reserved row on the other two
          is space spent on nothing. It sits fully inside the border rather than
          straddling it, which clipped the rounded corner. */}
      {isBest && (
        <span className="absolute left-3 top-3 z-10 rounded-full bg-primary-orange px-2 py-[2px] text-[9px] font-bold uppercase leading-none tracking-[1px] text-white">
          Best match
        </span>
      )}

      <div className="relative flex h-full flex-col gap-3 p-3">
        <Typography
          variant="p"
          className={`text-left font-bold leading-[130%] line-clamp-2 min-h-[32px] pr-7 ${
            isBest ? "mt-5" : ""
          }`}
          title={name}
        >
          {name}
        </Typography>

        {/* Hero: net annual value, the figure the ranking is built on. */}
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-hubot text-[32px] font-bold leading-none text-white [font-variant-numeric:tabular-nums]">
              {hasNetValue ? formatInrCompact(netValue) : "—"}
            </span>
          </div>
          <p className="mt-1 text-[11px] leading-tight text-white/60">
            {hasNetValue
              ? "Value back per year, after fees"
              : "Value back per year"}
          </p>
          {/* The basis every figure on this card rests on. Identical across all
              three cards, which is what makes them comparable. */}
          {typeof props?.annualSpendInr === "number" &&
            props.annualSpendInr > 0 && (
              <p className="mt-0.5 text-[10px] leading-tight text-white/40 [font-variant-numeric:tabular-nums]">
                On {formatInr(props.annualSpendInr)} projected spend
              </p>
            )}
        </div>

        {/* Where the rewards come from.
            The heading is load-bearing: without it "Domestic ₹26,263" is
            ambiguous — spend? reward? cap? Naming the section once answers it
            for every row, which is cheaper than qualifying each label. */}
        {streams.length > 0 && (
          <div className="border-t border-white/10 pt-2.5">
            <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[1.2px] text-white/35">
              You earn
            </p>

            <div className="flex flex-col gap-1.5">
              {streams.map((stream) => (
                <div key={stream.label} className="flex flex-col gap-[3px]">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[11px] capitalize text-white/60">
                      {stream.label}
                    </span>
                    <span
                      className={`shrink-0 text-[11px] font-semibold [font-variant-numeric:tabular-nums] ${
                        stream.isCost ? "text-[#FF8A66]" : "text-white/85"
                      }`}
                    >
                      {stream.isCost ? "−" : ""}
                      {formatInr(stream.valueInr)}
                    </span>
                  </div>
                  {/* Proportion sits with its own number rather than in a
                      separate strip, so it needs no legend to be read. */}
                  {earningsTotal > 0 && !stream.isCost && (
                    <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/[0.07]">
                      <div
                        className="h-full rounded-full bg-primary-orange"
                        style={{
                          width: `${Math.max(
                            3,
                            (stream.valueInr / earningsTotal) * 100,
                          )}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* The fee is a deduction, not an earning — it gets its own rule so it
            cannot be misread as another line in the list above. */}
        <div className="border-t border-white/10 pt-2">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-[11px] text-white/60">
              Annual fee
            </span>
            <span
              className={`shrink-0 text-[11px] font-semibold [font-variant-numeric:tabular-nums] ${
                fee.isFree ? "text-[#4ADE80]" : "text-white/85"
              }`}
            >
              {fee.isFree ? fee.label : `−${fee.label}`}
            </span>
          </div>
          {/* The tax basis, and the waiver condition when there is one. Empty
              only on the legacy string payload, which cannot vouch for either. */}
          {!fee.isFree && fee.detail && (
            <p className="mt-0.5 text-[9px] leading-tight text-white/40 [font-variant-numeric:tabular-nums]">
              {fee.detail}
            </p>
          )}
        </div>

        {/* One nudge, only when there is genuinely unclaimed value. When a
            sibling card in the row has a milestone and this one does not, the
            slot is still reserved — an empty box of the same height — so the
            row shares one baseline instead of three ragged ones. The
            placeholder says nothing rather than claiming ₹0: it is scaffolding,
            so it is hidden from screen readers. */}
        {milestone ? (
          <div className="rounded border border-primary-orange/25 bg-primary-orange/10 px-2 py-1.5">
            <p className="text-[10px] leading-snug text-white/80">
              Unlocks{" "}
              <span className="font-bold text-primary-orange [font-variant-numeric:tabular-nums]">
                {formatInr(milestone.annualValueInr)}
              </span>{" "}
              in milestone rewards
            </p>
          </div>
        ) : props?.reserveMilestoneSlot ? (
          <div
            aria-hidden="true"
            className="rounded border border-white/5 px-2 py-1.5"
          >
            <p className="text-[10px] leading-snug text-white/25">
              No milestone rewards
            </p>
          </div>
        ) : null}

        {/* The gap to the best match lives in the "Why this?" detail modal —
            on the card it was a third ranking cue competing with the rank
            numeral and the badge. */}

        <div className="mt-auto flex gap-2">
          <button
            className="w-full cursor-pointer rounded-full border border-primary-orange/70 p-2 py-1 text-[12px] text-white transition-colors hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-orange"
            onClick={() => {
              trackEvent(EventName.CHAT_CARD_WHY_THIS_CLICKED, {
                cardName: props?.cardName ?? "",
              });
              setOpen(true);
            }}
          >
            Why this?
          </button>

          {applyLink && (
            <a
              href={isLoading ? "" : applyLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackEvent(EventName.CHAT_CARD_APPLY_CLICKED, {
                  cardName: props?.cardName ?? "",
                })
              }
              className={`w-full min-w-[80px] rounded-full border border-secondary-orange p-2 py-1 text-center text-[12px] font-bold text-white transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-orange ${
                isLoading ? "bg-primary-orange/40" : "bg-primary-orange/80 hover:bg-primary-orange"
              }`}
            >
              {isLoading ? <Spinner /> : "Apply now"}
            </a>
          )}
        </div>
      </div>

      <CardRecommendationModal
        {...props}
        applyLink={applyLink}
        open={open}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}

export default ChatCard;
