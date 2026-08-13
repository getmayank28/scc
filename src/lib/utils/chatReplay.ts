import { CardsType } from "@/types/card";
import {
  BaseMessage,
  MESSAGE_SOURCE,
  MESSAGE_TYPE,
} from "@/types/chatMessages";
import { HistoryActions } from "@/types/actions";
import { HISTORY_ACTIONS } from "../constants/actions";
import { cardCategoryJourneyData } from "../constants/chatJourney";

/**
 * The chat "replay" contract.
 *
 * The journey (questions, answers, recommendation cards) is computed entirely
 * locally — the partner socket only ever sees the follow-up conversation. So on
 * reload there is nothing server-side to re-render the journey from *unless we
 * put it there ourselves*.
 *
 * We do that with `custom_metadata` on a single synthetic user message sent
 * once, right after the socket opens. The partner stores it and returns it
 * verbatim in the `history` frame, which `restoreFromReplay` below turns back
 * into the exact message list the user saw before the reload.
 *
 * Two rules make this survive future edits:
 *
 *  1. Store question *ids*, never rendered copy. Bubbles are rebuilt by looking
 *     each id up in `cardCategoryJourneyData`, so journey wording can change
 *     without invalidating stored sessions. (`buildRecommendInput` indexes
 *     questions the same way.)
 *  2. Store the recommendation payload verbatim. Recomputing on reload would
 *     re-run the engines against live data and could silently show different
 *     cards than the ones the user was originally given.
 */

// Bump when the payload shape changes in a way older readers can't handle.
export const REPLAY_VERSION = 1;

// `custom_metadata` is an array of single-key objects (that is the shape the
// partner accepts). These are the reserved keys; every other entry is a
// questionId -> answer pair.
//
// They are prefixed because question ids share this namespace and *do* collide
// otherwise: the category selector's own m_id is "card-category-fs", so an
// unprefixed CATEGORY key would swallow that question's answer and drop it from
// the restored journey. The prefix is not a legal m_id, so collisions are
// impossible by construction.
const RESERVED_PREFIX = "_replay:";

export const REPLAY_KEYS = {
  VERSION: `${RESERVED_PREFIX}v`,
  CATEGORY: `${RESERVED_PREFIX}category`,
  RECOMMENDATION: `${RESERVED_PREFIX}recommendation`,
  /** Phase-1 cards, kept when the user went on to fine-tune. */
  EARLIER_RECOMMENDATION: `${RESERVED_PREFIX}earlierRecommendation`,
  ACTION: `${RESERVED_PREFIX}action`,
} as const;

const isReservedKey = (key: string) => key.startsWith(RESERVED_PREFIX);

export type ReplayMetadata = Record<string, string>[];

export type RecommendationPayload = {
  startMessage: string;
  cards: unknown[];
  endMessage: string;
};

export type ReplayAnswer = {
  questionId: string;
  /** The display string that was shown in the user's bubble. */
  value: string;
};

export type DecodedReplay = {
  version: number;
  category: CardsType | null;
  answers: ReplayAnswer[];
  recommendation: RecommendationPayload | null;
  /** Phase-1 cards, present only when the user fine-tuned afterwards. */
  earlierRecommendation: RecommendationPayload | null;
  action: HistoryActions | null;
};

const firstKey = (entry: Record<string, string>) => Object.keys(entry)?.at(0);
const firstValue = (entry: Record<string, string>) => Object.values(entry)?.at(0);

/**
 * A flat index of a category's questions *including FORM inner inputs*, keyed
 * by m_id. The inner inputs matter: a FORM answer is stored per-field, so
 * restoring one needs to resolve ids that only exist inside `inputs`.
 */
function indexQuestions(category: CardsType): Map<string, BaseMessage> {
  const index = new Map<string, BaseMessage>();
  const questions = cardCategoryJourneyData?.[category] ?? [];

  for (const question of questions) {
    index.set(question.m_id, question);
    for (const inner of question.inputs ?? []) {
      index.set(inner.m_id, inner as BaseMessage);
    }
  }

  return index;
}

/* -------------------------------------------------------------------------- */
/*  Write path                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Build the `custom_metadata` array for a completed journey.
 *
 * `answers` should already be the journey's user messages (see
 * `collectReplayAnswers`). The recommendation is stringified into a single
 * entry — the partner imposes no size cap, and keeping it verbatim is what
 * guarantees the reloaded cards match the originals exactly.
 */
export function buildReplayMetadata({
  category,
  answers,
  recommendation,
  earlierRecommendation,
  action,
}: {
  category: CardsType;
  answers: ReplayAnswer[];
  recommendation: RecommendationPayload | null;
  earlierRecommendation?: RecommendationPayload | null;
  action: HistoryActions;
}): ReplayMetadata {
  const metadata: ReplayMetadata = [
    { [REPLAY_KEYS.VERSION]: String(REPLAY_VERSION) },
    { [REPLAY_KEYS.CATEGORY]: category },
  ];

  for (const answer of answers) {
    if (!answer.questionId) continue;
    // Defensive only — the reserved prefix is not a legal m_id, so this cannot
    // fire for real journey data.
    if (isReservedKey(answer.questionId)) continue;
    metadata.push({ [answer.questionId]: answer.value });
  }

  // Ordered first so the restored transcript reads the way it originally did:
  // phase-1 cards, then the fine-tuned set.
  if (earlierRecommendation) {
    metadata.push({
      [REPLAY_KEYS.EARLIER_RECOMMENDATION]:
        JSON.stringify(earlierRecommendation),
    });
  }

  if (recommendation) {
    metadata.push({
      [REPLAY_KEYS.RECOMMENDATION]: JSON.stringify(recommendation),
    });
  }

  metadata.push({ [REPLAY_KEYS.ACTION]: action });

  return metadata;
}

/**
 * Collapse journey user messages into replay answers.
 *
 * FORM answers are expanded into one entry per inner field so each slider
 * restores its own value; everything else stores the display string as-is.
 * Phase-2 ("end") only records answers after the fine-tune handoff, which is
 * marked on the message with `thread === 2`.
 */
export function collectReplayAnswers(
  messages: BaseMessage[],
  action: HistoryActions,
): ReplayAnswer[] {
  let scoped = messages;

  if (action === HISTORY_ACTIONS.END_RECOMMENDATION) {
    const handoffIndex = scoped.findIndex((message) => message?.thread === 2);
    if (handoffIndex !== -1) scoped = scoped.slice(handoffIndex + 1);
  }

  const answers: ReplayAnswer[] = [];

  for (const message of scoped) {
    if (message?.source !== MESSAGE_SOURCE.USER) continue;
    if (!message?.questionId) continue;

    // FORM answers carry their raw per-field values; store them individually so
    // each inner input can be restored with its own value.
    if (message.questionType === MESSAGE_TYPE.FORM && message.formValues) {
      for (const [innerId, value] of Object.entries(message.formValues)) {
        answers.push({ questionId: innerId, value: String(value) });
      }
      continue;
    }

    answers.push({
      questionId: message.questionId,
      value: String(message.content ?? ""),
    });
  }

  return answers;
}

/**
 * A compact natural-language rendering of the journey, used as the `content` of
 * the synthetic metadata message. The partner's agent reads this; our restore
 * path ignores it in favour of the structured metadata.
 */
export function buildReplaySummary(
  category: CardsType,
  answers: ReplayAnswer[],
): string {
  const questions = indexQuestions(category);

  const parts = answers
    // Only answers with `botContent` read as prose; the rest (e.g. the category
    // selector, whose value is a raw "action-…" string) would be noise.
    .filter((answer) => questions.get(answer.questionId)?.botContent)
    .map((answer) => {
      const question = questions.get(answer.questionId);
      return `${question?.botContent}${answer.value}`;
    });

  return `I want a ${category} card,${parts.join(" and")}`;
}

/* -------------------------------------------------------------------------- */
/*  Read path                                                                 */
/* -------------------------------------------------------------------------- */

/** Parse a `custom_metadata` array back into a structured replay. */
export function decodeReplayMetadata(
  metadata: ReplayMetadata | undefined,
): DecodedReplay | null {
  if (!metadata?.length) return null;

  const replay: DecodedReplay = {
    version: 0,
    category: null,
    answers: [],
    recommendation: null,
    earlierRecommendation: null,
    action: null,
  };

  for (const entry of metadata) {
    const key = firstKey(entry);
    const value = firstValue(entry);
    if (!key || value === undefined) continue;

    switch (key) {
      case REPLAY_KEYS.VERSION:
        replay.version = Number(value) || 0;
        break;
      case REPLAY_KEYS.CATEGORY:
        replay.category = value as CardsType;
        break;
      case REPLAY_KEYS.RECOMMENDATION:
        try {
          replay.recommendation = JSON.parse(value) as RecommendationPayload;
        } catch {
          // A corrupt payload should cost the cards, not the whole session.
          replay.recommendation = null;
        }
        break;
      case REPLAY_KEYS.EARLIER_RECOMMENDATION:
        try {
          replay.earlierRecommendation = JSON.parse(
            value,
          ) as RecommendationPayload;
        } catch {
          replay.earlierRecommendation = null;
        }
        break;
      case REPLAY_KEYS.ACTION:
        replay.action = value as HistoryActions;
        break;
      default:
        replay.answers.push({ questionId: key, value });
    }
  }

  // Without a category we cannot resolve any question, so there is nothing to
  // rebuild.
  return replay.category ? replay : null;
}

/**
 * Rebuild the journey message list from a decoded replay: for each answer, the
 * original question bubble (carrying `selectedValue` so its input renders in
 * the answered state) followed by the user's answer bubble.
 *
 * FORM questions are emitted once, with each inner input's `selectedValue`
 * filled in, rather than once per field.
 */
export function restoreJourneyMessages(replay: DecodedReplay): BaseMessage[] {
  if (!replay.category) return [];

  const questions = indexQuestions(replay.category);
  const restored: BaseMessage[] = [];

  // Answers belonging to a FORM, grouped by the parent question's m_id.
  const formValuesByParent = new Map<string, Record<string, string>>();
  const parentOf = new Map<string, string>();

  for (const question of cardCategoryJourneyData?.[replay.category] ?? []) {
    for (const inner of question.inputs ?? []) {
      parentOf.set(inner.m_id, question.m_id);
    }
  }

  for (const answer of replay.answers) {
    const parentId = parentOf.get(answer.questionId);
    if (!parentId) continue;
    const existing = formValuesByParent.get(parentId) ?? {};
    existing[answer.questionId] = answer.value;
    formValuesByParent.set(parentId, existing);
  }

  const emittedForms = new Set<string>();

  for (const answer of replay.answers) {
    const parentId = parentOf.get(answer.questionId);

    // ---- FORM field: emit the parent form once, with every field filled in.
    if (parentId) {
      if (emittedForms.has(parentId)) continue;
      emittedForms.add(parentId);

      const parent = questions.get(parentId);
      if (!parent) continue;

      const values = formValuesByParent.get(parentId) ?? {};

      restored.push({
        ...parent,
        inputs: parent.inputs?.map((inner) => ({
          ...inner,
          selectedValue: values[inner.m_id],
        })),
      } as BaseMessage);

      restored.push({
        name: parent.content,
        content: Object.entries(values)
          .map(([innerId, value]) => {
            const inner = questions.get(innerId);
            return `${inner?.botContent ?? ""}${value}`;
          })
          .join(""),
        m_id: crypto.randomUUID(),
        source: MESSAGE_SOURCE.USER,
        type: MESSAGE_TYPE.TEXT,
        questionId: parentId,
        questionType: parent.type,
        botContent: parent.botContent,
        formValues: values,
      } as BaseMessage);

      continue;
    }

    // ---- Plain question.
    const question = questions.get(answer.questionId);
    if (!question) continue;

    restored.push({
      ...question,
      selectedValue: answer.value,
    } as BaseMessage);

    restored.push({
      name: question.content,
      content: answer.value,
      m_id: crypto.randomUUID(),
      source: MESSAGE_SOURCE.USER,
      type: MESSAGE_TYPE.TEXT,
      questionId: answer.questionId,
      questionType: question.type,
      botContent: question.botContent,
    } as BaseMessage);
  }

  return restored;
}

function toRecommendationMessage(
  recommendation: RecommendationPayload,
): BaseMessage {
  return {
    source: MESSAGE_SOURCE.ASSISTANT,
    type: MESSAGE_TYPE.TEXT,
    content: "```json\n" + JSON.stringify(recommendation) + "\n```",
    m_id: crypto.randomUUID(),
  } as BaseMessage;
}

/**
 * The session's recommendations, oldest first, each wrapped back into the
 * ```json envelope the chat renders cards from (`isCardRecommendationResponse`
 * / `ScrollableArea`).
 *
 * A fine-tuned journey shows two sets of cards — the phase-1 result and the
 * refined one — and a reload has to bring back both, in that order, or the
 * transcript reads as though the first was never given.
 */
export function restoreRecommendationMessages(
  replay: DecodedReplay,
): BaseMessage[] {
  const messages: BaseMessage[] = [];

  if (replay.earlierRecommendation) {
    messages.push(toRecommendationMessage(replay.earlierRecommendation));
  }
  if (replay.recommendation) {
    messages.push(toRecommendationMessage(replay.recommendation));
  }

  return messages;
}
