"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, CreditCard, Loader2, Plus, Search, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import { useAddCardModal } from "@/contexts/AddCardContext";
import useUserData from "@/lib/hooks/useUserData";
import { bankIcon } from "@/lib/data/banks";
import { useAnalytics } from "@/lib/analytics/hooks/useAnalytics";
import { EventName } from "@/lib/analytics/types";
import {
  useAddCardMutation,
  useGetUserCardsQuery,
  useLazyGetCardBySearchQuery,
  useRemoveUserCardMutation,
} from "@/store/api";
import { cn } from "@/lib/utils";

interface CardOption {
  _id: string;
  name: string;
  bankName: string;
  slug?: string;
}

interface WalletRow {
  _id: string;
  cardId: CardOption | null;
}

const MIN_QUERY = 2;
const DEBOUNCE_MS = 200;

const bankLogo = (bank: string) => `/icons/banks/${bankIcon?.[bank] ?? bankIcon?.default}`;

/** A keyboard key, drawn like the reference's footer hints. */
const Kbd = ({ children }: { children: React.ReactNode }) => (
  <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-white/15 bg-white/[0.04] px-1.5 font-sans text-[11px] text-white/70">
    {children}
  </kbd>
);

/**
 * The one add-card surface for the whole app: a command-palette style modal.
 * Type to search, arrow keys to move, Enter to add; with an empty box it lists
 * the wallet so cards can be removed in the same place. Stays open after an
 * add so several cards can go in one sitting.
 *
 * Mounted once in Providers; open it from anywhere with
 * `useAddCardModal().openAddCard("<source>")`.
 */
const AddCardModal = () => {
  const { isOpen, source, closeAddCard } = useAddCardModal();
  const { userId } = useUserData();
  const { track } = useAnalytics();

  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [active, setActive] = useState(0);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { data: walletData, isFetching: isWalletLoading } = useGetUserCardsQuery(
    { userId },
    { skip: !userId || !isOpen },
  );
  const [search, { data: searchData, isFetching: isSearching }] = useLazyGetCardBySearchQuery();
  const [addCard] = useAddCardMutation();
  const [removeCard] = useRemoveUserCardMutation();

  const wallet: CardOption[] = useMemo(
    () =>
      ((walletData as WalletRow[] | undefined) ?? [])
        .map((r) => r.cardId)
        .filter((c): c is CardOption => !!c?._id),
    [walletData],
  );
  const walletIds = useMemo(() => new Set(wallet.map((c) => c._id)), [wallet]);

  // Reset each time it opens, and track the open.
  useEffect(() => {
    if (!isOpen) return;
    setQuery("");
    setDebounced("");
    setActive(0);
    track(EventName.ADD_CARD_MODAL_OPENED, { source });
  }, [isOpen, source, track]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (debounced.length >= MIN_QUERY) search({ query: debounced });
    setActive(0);
  }, [debounced, search]);

  const searching = debounced.length >= MIN_QUERY;
  const results: CardOption[] = useMemo(() => {
    if (!searching) return [];
    // One row per card: the catalogue can carry the same card under two ids.
    const seen = new Set<string>();
    return ((searchData as CardOption[] | undefined) ?? []).filter((c) => {
      const key = c.slug ?? c.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [searchData, searching]);

  const rows = searching ? results : wallet;

  const add = async (card: CardOption) => {
    if (walletIds.has(card._id) || pendingId) return;
    setPendingId(card._id);
    try {
      await addCard({ userId, cardId: card._id }).unwrap();
      track(EventName.ADD_CARD_ADDED, { source, cardName: card.name });
      toast.success(`${card.name} added`);
    } catch (err) {
      const status = (err as { status?: number })?.status;
      if (status === 409) toast("Already in your wallet");
      else toast.error("Couldn't add that card. Try again.");
    } finally {
      setPendingId(null);
    }
  };

  const remove = async (card: CardOption) => {
    if (pendingId) return;
    setPendingId(card._id);
    try {
      await removeCard({ userId, cardId: card._id }).unwrap();
      track(EventName.ADD_CARD_REMOVED, { source, cardName: card.name });
    } catch {
      toast.error("Couldn't remove that card. Try again.");
    } finally {
      setPendingId(null);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!rows.length) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = (active + (e.key === "ArrowDown" ? 1 : -1) + rows.length) % rows.length;
      setActive(next);
      listRef.current
        ?.querySelector<HTMLElement>(`[data-index="${next}"]`)
        ?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter" && searching) {
      e.preventDefault();
      const card = rows[active];
      if (card) add(card);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(o) => !o && closeAddCard()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content
          onKeyDown={onKeyDown}
          className="fixed left-1/2 top-[12vh] z-[71] w-[min(600px,calc(100vw-24px))] -translate-x-1/2 overflow-hidden rounded-2xl border border-brown-border bg-brown-sidebar font-satoshi text-white shadow-[0_40px_100px_-30px_rgba(0,0,0,0.9)] outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 max-md:top-[8vh]"
        >
          {/* Header + search, one block, like the reference */}
          <div className="p-2 pb-0">
            <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] px-3 py-2.5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary-orange/15 text-primary-orange">
                <CreditCard className="size-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <Dialog.Title className="text-[15px] font-semibold leading-tight">Add a card</Dialog.Title>
                <Dialog.Description className="text-xs text-white/50">
                  Add the cards you carry. We use them to tell you which one to pay with.
                </Dialog.Description>
              </div>
              <Dialog.Close
                className="flex size-8 items-center justify-center rounded-lg text-white/50 hover:bg-white/5 hover:text-white cursor-pointer"
                aria-label="Close"
              >
                <X className="size-4" />
              </Dialog.Close>
            </div>
            <label className="flex items-center gap-3 px-3 py-4">
              <Search className="size-5 shrink-0 text-white/40" aria-hidden />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by card or bank, e.g. Regalia, SBI Cashback"
                aria-label="Search cards"
                className="min-w-0 flex-1 bg-transparent text-[17px] text-white outline-none placeholder:text-white/35"
              />
              {isSearching && <Loader2 className="size-4 animate-spin text-white/40" aria-hidden />}
            </label>
          </div>

          {/* Results / wallet */}
          <div className="border-t border-brown-border">
            <div className="px-5 pt-4 pb-2 text-xs font-medium text-white/45">
              {searching
                ? `Search results (${results.length})`
                : `In your wallet (${wallet.length})`}
            </div>
            <div ref={listRef} className="max-h-[min(360px,45vh)] overflow-y-auto px-2 pb-2" role="listbox">
              {rows.map((card, i) => {
                const added = walletIds.has(card._id);
                const busy = pendingId === card._id;
                return (
                  <div
                    key={card._id}
                    data-index={i}
                    role="option"
                    aria-selected={i === active}
                    onMouseMove={() => setActive(i)}
                    onClick={() => searching && add(card)}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
                      i === active && "bg-white/[0.06]",
                      searching && !added && "cursor-pointer",
                    )}
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[oklch(0.96_0.012_60)]">
                      <Image src={bankLogo(card.bankName)} alt="" width={22} height={22} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[15px] font-semibold">{card.name}</div>
                      <div className="truncate text-xs text-white/50">{card.bankName}</div>
                    </div>
                    {busy ? (
                      <Loader2 className="size-4 animate-spin text-white/50" aria-hidden />
                    ) : searching ? (
                      added ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-secondary-success">
                          <Check className="size-3.5" aria-hidden /> In wallet
                        </span>
                      ) : (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                            i === active ? "bg-primary-orange text-white" : "bg-white/[0.06] text-white/70",
                          )}
                        >
                          <Plus className="size-3.5" aria-hidden /> Add
                        </span>
                      )
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          remove(card);
                        }}
                        className="flex size-8 items-center justify-center rounded-lg text-white/35 opacity-0 transition hover:bg-white/5 hover:text-rose-300 focus-visible:opacity-100 group-hover:opacity-100 max-md:opacity-100 cursor-pointer"
                        aria-label={`Remove ${card.name}`}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Empty states say what to do next */}
              {searching && !isSearching && results.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-white/50">
                  No cards match &ldquo;{debounced}&rdquo;. Try the bank name, or fewer words.
                </p>
              )}
              {!searching && !isWalletLoading && wallet.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-white/50">
                  Your wallet is empty. Search above to add your first card.
                </p>
              )}
              {!searching && query.trim().length === 1 && (
                <p className="px-3 pb-2 text-xs text-white/40">Keep typing to search…</p>
              )}
            </div>
          </div>

          {/* Footer: keyboard hints + done */}
          <div className="flex items-center gap-4 border-t border-brown-border px-5 py-3 text-xs text-white/50">
            <span className="flex items-center gap-1.5 max-md:hidden">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd> navigate
            </span>
            <span className="flex items-center gap-1.5 max-md:hidden">
              <Kbd>↵</Kbd> add
            </span>
            <span className="flex items-center gap-1.5 max-md:hidden">
              <Kbd>esc</Kbd> close
            </span>
            <span className="md:hidden">
              {wallet.length} card{wallet.length === 1 ? "" : "s"} in your wallet
            </span>
            <Dialog.Close className="ml-auto rounded-lg bg-white/[0.06] px-4 py-1.5 text-sm font-semibold text-white hover:bg-white/10 cursor-pointer">
              Done
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default AddCardModal;
