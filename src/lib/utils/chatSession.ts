import dayjs from "dayjs";
import { CHANNEL_LABEL } from "../constants/channel";

/**
 * A row from the partner bot's `get-sessions-by-user`, as proxied by
 * `/api/chat/session/bot`. The bot sends exactly these four fields — notably
 * there is no message `content` on the list payload, only on the per-session
 * details call.
 */
export type BotChatSession = {
  channel: string;
  session_id: string;
  timestamp: string;
  title: string;
};

/**
 * Titles the bot emits when it has not derived a real one. These are sentinels,
 * not content, so they have to be treated as absent — and they are truthy, so a
 * plain `title || fallback` silently renders them.
 */
const PLACEHOLDER_TITLES = new Set(["untitled", "new chat", "null", "undefined"]);

/** Upstream text is untrusted; a runaway title would blow out the sidebar. */
const MAX_TITLE_LENGTH = 60;

const isPlaceholderTitle = (title: string | null | undefined): boolean => {
  const normalized = title?.trim().toLowerCase() ?? "";
  return normalized === "" || PLACEHOLDER_TITLES.has(normalized);
};

/**
 * Label for a session with no title of its own: what kind of chat it was, plus
 * when it happened — `"Match · 16 Aug, 2:25 PM"`.
 *
 * The time is what actually makes these rows distinguishable, since every
 * untitled session in a channel would otherwise read identically. Rendered in
 * the viewer's local zone: the bot sends GMT, but the reader is thinking in
 * their own clock.
 */
const buildFallbackTitle = (session: BotChatSession): string => {
  const label = CHANNEL_LABEL[session?.channel];
  const at = dayjs(session?.timestamp);
  const when = at.isValid() ? at.format("D MMM, h:mm A") : "";

  // Either half may be missing (unknown channel, unparseable timestamp); joining
  // only the parts we have keeps a lone separator from rendering.
  return [label, when].filter(Boolean).join(" · ") || "Chat";
};

/**
 * What to show for a chat session in the sidebar.
 *
 * Prefers the bot's own title and falls back to a channel + timestamp label
 * when that title is missing or a placeholder.
 */
export const resolveSessionTitle = (session: BotChatSession): string => {
  if (isPlaceholderTitle(session?.title)) return buildFallbackTitle(session);

  const title = session.title.trim();
  return title.length > MAX_TITLE_LENGTH
    ? `${title.slice(0, MAX_TITLE_LENGTH).trimEnd()}…`
    : title;
};
