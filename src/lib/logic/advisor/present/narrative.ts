import type { EngineResult, RecommendCategory } from "./cards";

const CATEGORY_LABEL: Record<RecommendCategory, string> = {
  travel: "travel",
  food: "food & dining",
  shopping: "shopping",
  allrounder: "everyday",
};

/**
 * Deterministic, templated start/end narrative built from the numbers the
 * engine already computed — no LLM. Rendered as HTML (`**bold**` becomes
 * <b>) by the existing chat render path.
 */
export function buildNarrative(
  category: RecommendCategory,
  result: EngineResult,
): { startMessage: string; endMessage: string } {
  const label = CATEGORY_LABEL[category];
  const count = result.byCard.length;

  if (count === 0) {
    return {
      startMessage: `I couldn't find a clearly better ${label} card for the spends you shared.`,
      endMessage:
        "Try adjusting your inputs, or explore an all-rounder card that rewards spending across categories.",
    };
  }

  const topName = result.byCard[0].cardName;
  const startMessage =
    count >= 3
      ? `Based on your ${label} spends, here are the **top 3 cards** for you.`
      : count === 2
        ? `Based on your ${label} spends, here are the **2 best cards** for you.`
        : `Based on your ${label} spends, **${topName}** is your best-fit card.`;

  const endMessage =
    count > 1
      ? `**${topName}** gives the highest net return; the others trade off annual fee, lounge access or forex. Ask me anything about these cards.`
      : `Ask me anything about **${topName}** — fees, rewards, or how it compares to other cards.`;

  return { startMessage, endMessage };
}
