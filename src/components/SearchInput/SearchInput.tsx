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
  onClearInput,
  error,
  disabled
}: {
  selected: Card | null;
  setSelected: (card: Card | null) => void;
  query: string;
  setQuery: (value: string) => void;
  searchInputRef: RefObject<HTMLInputElement | null>;
  onClearInput?: () => void;
  error?:boolean;
  disabled?:boolean
}) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  
  const [open, setOpen] = useState(false);

  const [triggerSearch, { data = [], isFetching }] =
    useLazyGetCardBySearchQuery();

  // Trigger search with debounce
  useEffect(() => {
    if (!query || selected) return;

    const timer = setTimeout(() => {
      triggerSearch({ query });
      setOpen(true);
    }, 400);

    return () => clearTimeout(timer);
  }, [query, selected, triggerSearch]);

  // Close dropdown on outside click
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
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md">
      <Input
        disabled={disabled}
        ref={searchInputRef}
        placeholder="Enter card name..."
        value={selected ? selected.name : query}
        onChange={(e) => {
          setSelected(null);
          setQuery(e.target.value);
        }}
        onFocus={() => data.length > 0 && setOpen(true)}
        className={`text-white text-lg h-12 max-md:text-xs  ${error ? "border-destructive" : "border-primary-orange"}`}
      />

      {/* Loader */}
      {isFetching && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 animate-spin text-white" />
      )}

      {/* Clear icon */}
      {(selected || query) && !isFetching && (
        <BadgeX
          className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 text-white cursor-pointer"
          onClick={onClearInput}
        />
      )}

      {/* Results */}
      {open && data.length > 0 && !selected && (
        <UiCard className="absolute z-50 mt-1 w-full max-md:py-2 max-md:px-0 rounded-lg border-2 border-secondary-orange bg-brown-sidebar">
          <CardContent className="p-1 max-md:px-0">
            {data.map((card: Card) => (
              <button
                key={card._id}
                type="button"
                onClick={() => {
                  setSelected(card);
                  setOpen(false);
                }}
                className="flex w-full justify-between max-md:items-center rounded-xl px-3 py-2 text-left text-sm group"
              >
                <span className="font-medium max-md:text-[12px] text-white group-hover:text-primary-orange">
                  {card.name}
                </span>
                <span className="text-xs max-md:text-[8px] font-bold text-primary-orange">
                  {card.bankName}
                </span>
              </button>
            ))}
          </CardContent>
        </UiCard>
      )}

      {/* No results */}
      {open && !isFetching && data.length === 0 && query && !selected && (
        <UiCard className="absolute z-50 mt-1 w-full rounded-lg border-secondary-orange bg-background-primary">
          <CardContent className="p-4 text-center text-sm text-gray-400">
            No cards found as per your query
          </CardContent>
        </UiCard>
      )}
    </div>
  );
}
