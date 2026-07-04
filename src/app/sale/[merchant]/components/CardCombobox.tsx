"use client";

import { useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, CreditCard, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface CardOption {
  slug: string;
  name: string;
  bank: string;
}

interface CardComboboxProps {
  cards: CardOption[];
  value: string | null;
  onChange: (slug: string) => void;
  placeholder?: string;
}

const MAX_RESULTS = 60;

/**
 * Searchable card picker (combobox) built on Popover + a filtered list. Handles
 * the ~360-card dataset with type-to-filter and full keyboard support. Custom to
 * this page since the app's plain Select isn't searchable.
 */
export function CardCombobox({
  cards,
  value,
  onChange,
  placeholder = "Search your credit card…",
}: CardComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(
    () => cards.find((c) => c.slug === value) ?? null,
    [cards, value]
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cards.slice(0, MAX_RESULTS);
    return cards
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) || c.bank.toLowerCase().includes(q)
      )
      .slice(0, MAX_RESULTS);
  }, [cards, query]);

  const commit = (slug: string) => {
    onChange(slug);
    setOpen(false);
    setQuery("");
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      commit(results[active].slug);
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setActive(0);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls="card-combobox-list"
          aria-haspopup="listbox"
          className={cn(
            "flex w-full items-center gap-3 rounded-2xl border border-white/12 bg-white/[0.03] px-4 py-3.5 text-left transition-colors outline-none",
            "hover:border-white/25 focus-visible:border-primary-orange/60 focus-visible:ring-2 focus-visible:ring-primary-orange/40"
          )}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-orange/10 text-primary-orange">
            <CreditCard className="size-4.5" />
          </span>
          <span className="min-w-0 flex-1">
            {selected ? (
              <>
                <span className="block truncate text-sm font-medium text-white">
                  {selected.name}
                </span>
                <span className="block truncate text-xs text-white/50">
                  {selected.bank}
                </span>
              </>
            ) : (
              <span className="text-sm text-white/50">{placeholder}</span>
            )}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-white/40" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-2xl border-white/12 bg-background-primary p-0 text-white shadow-2xl shadow-black/60"
      >
        <div className="flex items-center gap-2 border-b border-white/10 px-3.5 py-3">
          <Search className="size-4 text-white/40" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Search 300+ cards…"
            className="w-full bg-transparent text-sm text-white placeholder:text-white/40 outline-none"
            aria-label="Search cards"
          />
        </div>

        <div className="max-h-64 overflow-y-auto overscroll-contain">
          <div id="card-combobox-list" ref={listRef} role="listbox" className="p-1.5">
            {results.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-white/40">
                No cards match “{query}”.
              </p>
            ) : (
              results.map((card, i) => {
                const isSelected = card.slug === value;
                const isActive = i === active;
                return (
                  <button
                    key={card.slug}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => commit(card.slug)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left transition-colors",
                      isActive ? "bg-white/[0.06]" : "bg-transparent"
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-white">
                        {card.name}
                      </span>
                      <span className="block truncate text-xs text-white/45">
                        {card.bank}
                      </span>
                    </span>
                    {isSelected && (
                      <Check className="size-4 shrink-0 text-primary-orange" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
