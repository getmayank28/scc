"use client";

/**
 * Shown in place of the typing loader when the partner never answered a turn
 * within `SOCKET_REPLY_TIMEOUT_MS`. Without this the chat simply hangs: the
 * loader spins forever and the input stays locked, leaving the user no way to
 * retry the message they already sent.
 */
export const ChatReplyTimeout = ({ onRetry }: { onRetry: () => void }) => (
  <div
    role="alert"
    className="flex max-w-[85%] max-md:max-w-[75%] flex-col gap-3 rounded-md border border-brown-border bg-brown-sidebar px-4 py-3 max-md:px-3"
  >
    <p className="text-sm max-md:text-xs leading-relaxed text-gray-100">
      That took longer than expected. Please try again.
    </p>
    <button
      type="button"
      onClick={onRetry}
      className="w-fit cursor-pointer rounded-full border border-secondary-orange bg-primary-orange/80 px-4 py-1 text-[12px] font-bold text-white"
    >
      Try again
    </button>
  </div>
);

export default ChatReplyTimeout;
