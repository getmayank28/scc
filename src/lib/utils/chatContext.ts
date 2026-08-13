import { CardsType } from "@/types/card";
import {
  CHAT_PENDING_REPLAY_KEY,
  CHAT_RECOMMENDATION_CONTEXT_KEY,
} from "../constants/storage";
import type { ReplayMetadata, RecommendationPayload } from "./chatReplay";

/**
 * Context handed to the partner bot, and the local stash that makes it survive
 * a reload.
 *
 * Two separate channels, deliberately:
 *
 *  - `custom_data` is read once, at connect time, and never comes back. It
 *    carries prose for the agent to ground its follow-up answers on.
 *  - `custom_metadata` (see `chatReplay.ts`) round-trips through the history
 *    frame and carries the structured payload our own UI restores from.
 *
 * Both are produced at the same moment — when the local engine returns a
 * recommendation — and both are stashed in sessionStorage until the socket is
 * open and the partner has minted a session id. That stash is what covers the
 * window where cards are on screen but nothing has been persisted yet.
 */

export type PendingReplay = {
  category: CardsType;
  metadata: ReplayMetadata;
  /** The NL content of the synthetic carrier message. */
  summary: string;
  /** Kept so a reload inside the pre-session window can re-render the cards. */
  recommendation: RecommendationPayload | null;
  /**
   * The phase-1 recommendation, when this replay is a phase-2 one. The agent is
   * told about both so it can answer "why did your suggestion change?".
   */
  earlierRecommendation?: RecommendationPayload | null;
  /**
   * Whether this replay may be handed to the partner yet.
   *
   * A phase-1 recommendation is *not* final: the user is still being asked
   * whether to fine-tune. Connecting at that point would spend the agent's one
   * read of `custom_data` on context that phase 2 is about to supersede. So the
   * stash is written immediately (a reload must not lose the cards) but stays
   * unreleased until the journey actually ends.
   */
  released: boolean;
};

const isBrowser = () => typeof window !== "undefined";

/**
 * sessionStorage writes do not notify the current tab, so the socket gate
 * (which must open the moment a recommendation exists) would never see the
 * change. This event bridges that gap.
 */
export const REPLAY_CHANGED_EVENT = "chat-replay-changed";

function notifyReplayChanged() {
  if (!isBrowser()) return;
  window.dispatchEvent(new Event(REPLAY_CHANGED_EVENT));
}

/* -------------------------------------------------------------------------- */
/*  custom_data (connect-time, one-way)                                       */
/* -------------------------------------------------------------------------- */

/**
 * Prose context for the agent. Richer than a bare card list: the spend answers
 * are included so follow-ups like "what if I spend more on dining?" have
 * something to reason against.
 */
function formatCards(recommendation: RecommendationPayload | null): string {
  const cards = (recommendation?.cards ?? []) as Record<string, string>[];
  if (!cards.length) return "No card recommendation was produced.";

  return cards
    .map((card, index) => {
      const parts = [
        `${index + 1}. ${card.cardName}`,
        card.returnOnSpend ? `return on spend ${card.returnOnSpend}%` : "",
        card.annualFee ? `annual fee ${card.annualFee}` : "",
        card.categoryWiseReward ? `rewards: ${card.categoryWiseReward}` : "",
        card.whyThisCard ? `why: ${card.whyThisCard}` : "",
        card.notIdealFor ? `not ideal for: ${card.notIdealFor}` : "",
      ].filter(Boolean);
      return parts.join(", ");
    })
    .join("\n");
}

export function buildBotContext({
  category,
  summary,
  recommendation,
  earlierRecommendation,
}: {
  category: CardsType;
  summary: string;
  recommendation: RecommendationPayload | null;
  earlierRecommendation?: RecommendationPayload | null;
}): string {
  const lines = [
    `The user has finished a ${category} credit-card journey. This is context, not a new request.`,
    `What they told us: ${summary}`,
    "",
  ];

  // When the user chose to fine-tune, both sets are already on their screen and
  // either may be asked about — including why the second differs from the first.
  if (earlierRecommendation) {
    lines.push(
      "I first recommended these cards:",
      formatCards(earlierRecommendation),
      "",
      "Then they answered more questions and I recommended these instead:",
      formatCards(recommendation),
    );
  } else {
    lines.push(
      "I have already recommended these cards to them:",
      formatCards(recommendation),
    );
  }

  lines.push(
    "",
    "These cards are already displayed to the user. Do not repeat or re-list them.",
    "Answer their follow-up questions about these cards.",
    "Do not recommend a different set of cards unless they explicitly ask.",
  );

  return lines.join("\n");
}

/**
 * Encode context for the `custom_data` query parameter.
 *
 * The partner expects *standard* base64 (not base64url), whose alphabet
 * includes `+`, `/` and `=` — all of which change meaning inside a query
 * string. So the base64 is percent-encoded on top; the caller must not encode
 * it a second time.
 */
export function encodeBotContext(context: string): string {
  const json = JSON.stringify({ context });

  // btoa() is latin1-only; route through UTF-8 first so non-ASCII (₹, Hindi)
  // survives instead of throwing.
  const utf8 = new TextEncoder().encode(json);
  let binary = "";
  for (const byte of utf8) binary += String.fromCharCode(byte);

  return encodeURIComponent(btoa(binary));
}

/* -------------------------------------------------------------------------- */
/*  Local stash                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Persist the replay + context produced by a completed journey.
 *
 * sessionStorage, not localStorage: a chat is per-tab, and a stale replay
 * leaking into a new tab would attach one journey's cards to another session.
 */
export function savePendingReplay(pending: PendingReplay) {
  if (!isBrowser()) return;

  sessionStorage.setItem(CHAT_PENDING_REPLAY_KEY, JSON.stringify(pending));
  sessionStorage.setItem(
    CHAT_RECOMMENDATION_CONTEXT_KEY,
    buildBotContext({
      category: pending.category,
      summary: pending.summary,
      recommendation: pending.recommendation,
      earlierRecommendation: pending.earlierRecommendation,
    }),
  );

  notifyReplayChanged();
}

export function getPendingReplay(): PendingReplay | null {
  if (!isBrowser()) return null;

  const raw = sessionStorage.getItem(CHAT_PENDING_REPLAY_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as PendingReplay;
  } catch {
    return null;
  }
}

/** The encoded `custom_data` value for the next connection, if any. */
export function getEncodedBotContext(): string | null {
  if (!isBrowser()) return null;

  const context = sessionStorage.getItem(CHAT_RECOMMENDATION_CONTEXT_KEY);
  return context ? encodeBotContext(context) : null;
}

/**
 * Whether this tab has a *released* recommendation. The socket stays closed
 * until it does, so the agent's one shot at reading `custom_data` carries the
 * final journey rather than a phase-1 result phase 2 would overwrite.
 */
export function hasPendingRecommendation(): boolean {
  return !!getPendingReplay()?.released;
}

/**
 * Mark the stashed replay as final and let the socket connect.
 *
 * Called when the journey is genuinely over: either the user declined to
 * fine-tune, or phase 2 produced its recommendation.
 */
export function releasePendingReplay() {
  const pending = getPendingReplay();
  if (!pending || pending.released) return;

  savePendingReplay({ ...pending, released: true });
}

export function clearPendingReplay() {
  if (!isBrowser()) return;

  sessionStorage.removeItem(CHAT_PENDING_REPLAY_KEY);
  sessionStorage.removeItem(CHAT_RECOMMENDATION_CONTEXT_KEY);

  notifyReplayChanged();
}
