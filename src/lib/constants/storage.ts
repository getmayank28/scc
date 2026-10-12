export const CARD_CATEGORY_KEY = "card_category";

// The replay payload for a completed journey, stashed until the socket is open
// and the partner has minted a session id. sessionStorage (per-tab) so one
// tab's journey can never attach itself to another tab's chat.
export const CHAT_PENDING_REPLAY_KEY = "chat_pending_replay";

// Prose context for the partner agent, encoded into `custom_data` at connect.
export const CHAT_RECOMMENDATION_CONTEXT_KEY = "chat_recommendation_context";
