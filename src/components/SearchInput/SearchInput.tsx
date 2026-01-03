"use client";

import { RefObject, useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Card as UiCard, CardContent } from "@/components/ui/card";
import { BadgeX, Loader2 } from "lucide-react";
import { useLazyGetCardBySearchQuery } from "@/store/api";

interface Card {
  _id: string;
  name: string;
  bankName: string;
}

export default function SearchSelect({
  query,
  setQuery,
  selected,
  setSelected,
  searchInputRef,
  onClearInput
}: {
  selected: Card | null;
  setSelected: (card: Card | null) => void;
  query: string;
  setQuery: (value: string) => void;
  searchInputRef: RefObject<HTMLInputElement | null>;
  onClearInput?:() => void
}) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const [open, setOpen] = useState(false);

  const [triggerSearch, { data = [], isFetching }] =
    useLazyGetCardBySearchQuery();

  useEffect(() => {
    if (!query || selected) return;

    const timer = setTimeout(() => {
      triggerSearch({ query });
      setOpen(true);
    }, 400);

    return () => clearTimeout(timer);
  }, [query, selected, triggerSearch]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md">
      <Input
        ref={searchInputRef}
        placeholder="Enter card name..."
        value={selected ? selected.name : query}
        onChange={(e) => {
          setSelected(null);
          setQuery(e.target.value);
        }}
        onFocus={() => data.length && setOpen(true)}
        className="text-white text-lg h-12 border-primary-orange"
      />

      {isFetching && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 animate-spin text-white" />
      )}

      {(selected ||
        query) && (
          <BadgeX className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 text-white cursor-pointer" onClick={onClearInput} />
        )}

      {open && data.length > 0 && !selected && (
        <UiCard className="absolute z-50 mt-1 w-full rounded-lg border-secondary-orange bg-background-primary">
          <CardContent className="p-1">
            {data.map((card: Card) => (
              <button
                key={card._id}
                type="button"
                onClick={() => {
                  setSelected(card);
                  setOpen(false);
                }}
                className="flex w-full cursor-pointer justify-between rounded-xl px-3 py-2 text-left text-sm group"
              >
                <span className="font-medium text-white group-hover:text-primary-orange">
                  {card.name}
                </span>
                <span className="text-xs font-bold text-primary-orange">
                  {card.bankName}
                </span>
              </button>
            ))}
          </CardContent>
        </UiCard>
      )}
    </div>
  );
}
