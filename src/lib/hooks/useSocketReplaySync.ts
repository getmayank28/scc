"use client";

import { useEffect, useRef } from "react";
import { ReadyState } from "react-use-websocket";
import { getPendingReplay } from "../utils/chatContext";
import { FOLLOW_UP_TRIGGER_MID } from "../constants/chat";

/**
 * Deliver the journey replay to the partner once the socket is open.
 *
 * The journey and its recommendation are computed locally and never travel over
 * the socket as ordinary messages, so without this the partner would store a
 * conversation that starts mid-way and a reload would have nothing to rebuild
 * from. Sending it as `custom_metadata` on a single synthetic user turn gets it
 * into the partner's history, which comes back verbatim.
 *
 * Sent once per connection: a reconnect must not append a second copy, or
 * `loadHistory` would rebuild the journey twice.
 *
 * The `content` is deliberately empty. This turn exists to carry metadata, not
 * to say anything: a readable summary here ("I want a travel card, my trips
 * are…") reads to the agent as a fresh request and makes it answer with its own
 * recommendation, on top of the cards we already showed. The agent gets the same
 * information as prose through `custom_data` at connect time instead.
 */
export function useSocketReplaySync({
  readyState,
  sendMessageToSocket,
}: {
  readyState: number;
  sendMessageToSocket: (message: string) => void;
}) {
  const sentRef = useRef(false);

  useEffect(() => {
    if (readyState !== ReadyState.OPEN) {
      // Arm for the next connection; the partner does not retain unacknowledged
      // turns across a drop.
      sentRef.current = false;
      return;
    }

    if (sentRef.current) return;

    const pending = getPendingReplay();
    if (!pending?.metadata?.length) return;

    sentRef.current = true;

    sendMessageToSocket(
      JSON.stringify({
        source: "user",
        content: "",
        m_id: crypto.randomUUID(),
        ts: new Date().toISOString(),
        type: "TextMessage",
        custom_metadata: pending.metadata,
      }),
    );

    // Then invite the agent to speak. This has to happen here rather than at
    // the "start follow-up" click: at that moment the socket is still closed
    // (releasing the replay is what opens it), so the message would be dropped.
    sendMessageToSocket(
      JSON.stringify({
        source: "user",
        content: "Start the follow up",
        m_id: FOLLOW_UP_TRIGGER_MID,
        ts: new Date().toISOString(),
        type: "TextMessage",
        custom_metadata: [],
      }),
    );
  }, [readyState, sendMessageToSocket]);
}
