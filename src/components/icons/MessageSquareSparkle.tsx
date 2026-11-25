import { createLucideIcon } from "lucide-react";

/** Chat bubble with a sparkle inside — the Card Advisor icon. Lucide has no such glyph. */
const MessageSquareSparkle = createLucideIcon("message-square-sparkle", [
  ["path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z", key: "bubble" }],
  ["path", { d: "M12 6.5 13 9l2.5 1-2.5 1-1 2.5-1-2.5-2.5-1L11 9z", key: "sparkle" }],
]);

export default MessageSquareSparkle;
