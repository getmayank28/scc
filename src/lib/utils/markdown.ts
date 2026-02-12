import { BotRecommendationCreditCardProps } from "@/types/card";

export type ParsedMessage = {
  startMessage: string;
  cards: Record<string, string>[];
  endMessage: string;
};

/**
 * Check if a message contains a markdown table
 */
export function containsMarkdownTable(message: string): boolean {
  const tableHeaderPattern = /^\s*\|(?:\s*:?[-]+:?\s*\|)+/m;
  return tableHeaderPattern.test(message);
}

export function isCardRecommendationResponse(txt: string) {
  const text = safeParseJson(txt);
  let data;

  try {
    data = typeof text === "string" ? JSON.parse(text) : text;
  } catch {
    return false;
  }

  if (!data || typeof data !== "object") return false;

  return data.cards.every(
    (card: BotRecommendationCreditCardProps) =>
      card &&
      typeof card === "object" &&
      typeof card.cardName === "string" &&
      typeof card.returnOnSpend === "string" &&
      typeof card.applyLink === "string",
  );
}

function extractJsonFromLLM(text: string): string {
  if (!text) throw new Error("Empty response");

  // Prefer ```json blocks
  const fencedMatch = text.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fencedMatch) {
    return fencedMatch[1];
  }

  // Fallback: first {...} block
  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    return objectMatch[0];
  }

  throw new Error("No JSON found in response");
}

function sanitizeJsonString(json: string): string {
  return (
    json
      // remove markdown bold
      .replace(/\*\*(.*?)\*\*/g, "$1")
      // remove trailing commas (LLM classic bug)
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]")
  );
}

export function safeParseJson<T>(text: string): T | null {
  try {
    const extracted = extractJsonFromLLM(text);
    const sanitized = sanitizeJsonString(extracted);
    return JSON.parse(sanitized);
  } catch (err) {
    console.error("JSON parse failed:", err);
    return null;
  }
}

export function convertBoldMarkdownToHtml(text: string) {
  if (!text) return "";

  return (
    text
      // remove ```json or ``` (opening fence)
      .replace(/^```[\w]*\n?/, "")
      // remove closing ```
      .replace(/\n?```$/, "")
      // convert **bold** to <b>
      .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
  );
}

/**
 * Convert markdown table to JSON
 */
function toCamelCase(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase());
}

function extractMarkdownLink(input: string): string | null {
  const match = input.match(/\]\((.*?)\)/);
  return match ? match[1] : null;
}
function containsLink(input: string): boolean {
  const urlRegex = /(https?:\/\/[^\s]+)/i;
  return urlRegex.test(input);
}

export function markdownToJson(mdText: string): ParsedMessage {
  const splitIndex = mdText.indexOf("\n\n|");
  const endIndex = mdText.indexOf("|\n\n");

  const startMessage =
    splitIndex >= 0 ? mdText.slice(0, splitIndex).trim() : mdText;
  const tableMd =
    splitIndex >= 0 ? mdText.slice(splitIndex, endIndex).trim() : "";
  const endMessage = endIndex >= 0 ? mdText.slice(endIndex).trim() : "";

  const lines = tableMd.split("\n").filter(Boolean);
  if (lines.length < 2) return { startMessage, cards: [], endMessage };

  // Parse headers
  const headers = lines[0]
    .split("|")
    .map((h) => h.trim())
    .filter(Boolean);

  const cards = [];

  // Parse rows (skip header separator at index 1)
  for (let i = 2; i < lines.length; i++) {
    const cols = lines[i]
      .split("|")
      .map((c) => c.trim())
      .filter(Boolean);
    if (cols.length !== headers.length) continue;

    const card: Record<string, string> = {};

    for (let i = 0; i < headers.length; i++) {
      if (containsLink(cols[i])) {
        card[toCamelCase(headers[i])] = extractMarkdownLink(cols[i]) || "";
      } else {
        card[toCamelCase(headers[i])] = cols[i];
      }
    }
    cards.push(card);
  }

  return { startMessage, cards, endMessage };
}
