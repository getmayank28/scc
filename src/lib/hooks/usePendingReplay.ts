"use client";

import { useEffect, useState } from "react";
import {
  REPLAY_CHANGED_EVENT,
  hasPendingRecommendation,
} from "../utils/chatContext";

/**
 * Whether this tab has a locally-computed recommendation waiting to be handed
 * to the partner.
 *
 * The socket connection is gated on this: it stays closed for the whole guided
 * journey and opens only once there is a recommendation, so the agent's
 * single read of `custom_data` carries the context it needs.
 *
 * Reads on mount (covers a reload mid-handoff) and re-reads on the
 * replay-changed event, since sessionStorage writes do not notify their own tab.
 */
export function usePendingReplay(): boolean {
  const [hasReplay, setHasReplay] = useState(false);

  useEffect(() => {
    const sync = () => setHasReplay(hasPendingRecommendation());

    sync();

    window.addEventListener(REPLAY_CHANGED_EVENT, sync);
    // Another tab clearing its chat should not strand this one, but keep the
    // read consistent if the browser fires a cross-tab storage event.
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener(REPLAY_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return hasReplay;
}
