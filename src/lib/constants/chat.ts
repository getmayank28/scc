/**
 * The `/chat/[sessionId]` placeholder for a chat that has no partner session
 * yet. The guided journey runs entirely locally under this id; the URL is
 * swapped for the real session id once the partner mints one.
 */
export const NEW_SESSION_ID = "new";

/**
 * The control turn that invites the partner to open free follow-up Q&A. It is
 * our own scaffolding, not something the user said, so history restore drops it.
 */
export const FOLLOW_UP_TRIGGER_MID = "start-follow-up";

/**
 * How long we wait for the partner to answer a message we sent before giving
 * up on it. Nothing renders until the `FinalMessage` arrives, so without a
 * deadline a silent partner leaves the typing loader spinning and the input
 * locked with no way out. The window is refreshed by any inbound chunk for the
 * pending turn — a slow reply is not a hang.
 */
export const SOCKET_REPLY_TIMEOUT_MS = 60_000;
