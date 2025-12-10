type ParsedMessage = {
  message: string;
  cards: Record<string, string>[];
};

/**
 * Check if a message contains a markdown table
 */
export function containsMarkdownTable(message: string): boolean {
  const tableHeaderPattern = /^\s*\|(?:\s*:?[-]+:?\s*\|)+/m;
  return tableHeaderPattern.test(message);
}

export function convertBoldMarkdownToHtml(text: string): string {
  return text.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
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
  const message = splitIndex >= 0 ? mdText.slice(0, splitIndex).trim() : mdText;
  const tableMd = splitIndex >= 0 ? mdText.slice(splitIndex).trim() : "";

  const lines = tableMd.split("\n").filter(Boolean);
  if (lines.length < 2) return { message, cards: [] };

  //   console.log(lines)

  // Parse headers
  const headers = lines[0]
    .split("|")
    .map((h) => h.trim())
    .filter(Boolean);

  // console.log(headers)

  const cards = [];

  // Parse rows (skip header separator at index 1)
  for (let i = 2; i < lines.length; i++) {
    const cols = lines[i]
      .split("|")
      .map((c) => c.trim())
      .filter(Boolean);
    if (cols.length !== headers.length) continue;

    // console.log(cols)

    const card: Record<string, string> = {};

    for (let i = 0; i < headers.length; i++) {
      if (containsLink(cols[i])) {
        card[toCamelCase(headers[i])] = extractMarkdownLink(cols[i]) || "";
      } else {
        card[toCamelCase(headers[i])] = cols[i];
      }
    }
    // console.log(card)
    cards.push(card);
  }

  return { message, cards };
}
