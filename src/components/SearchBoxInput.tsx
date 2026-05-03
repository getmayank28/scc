"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";


export interface SearchboxOption {
  _id:string;
  value: string;
  name: string;
  description?: string;
  badge?: string;
}

interface SearchboxInputProps {
  options: SearchboxOption[];
  value: string;
  onChange: (value: string) => void;
  badgeColors?: Record<string, string>;
  error?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  id?: string;
  filterFn?: (option: SearchboxOption, query: string) => boolean;
  disabled?:boolean
}


export function SearchboxInput({
  disabled,
  options,
  value,
  onChange,
  error,
  label,
  placeholder = "Search or type...",
  required = false,
  id = "searchbox-input",
  filterFn,
}: SearchboxInputProps) {
  const [inputValue, setInputValue] = React.useState(value ?? "");
  const [open, setOpen] = React.useState(false);
  const [highlighted, setHighlighted] = React.useState<number>(-1);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);


  // Sync external value → input text
  React.useEffect(() => {
    setInputValue(value ?? "");
  }, [value]);

  // Close on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        commitFreeText();
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  });

  // ── Filtering ──────────────────────────────────────────────────────────────

  const defaultFilter = (option: SearchboxOption, query: string) => {
    const q = query?.toLowerCase();
    return (
      option.name?.toLowerCase().includes(q)
    );
  };

  const filtered = React.useMemo(() => {
    if (!inputValue?.trim()) return [];
    const fn = filterFn ?? defaultFilter;
    return options?.filter((o) => fn(o, inputValue));
  }, [inputValue, options, filterFn]);

  // Only open dropdown when there's typed input AND there are matches
  const shouldShowDropdown = open && inputValue?.trim()?.length > 0 && filtered?.length > 0;
  
  const selectOption = (option: SearchboxOption) => {
    setInputValue(option.name);
    onChange(option.name);
    setOpen(false);
    setHighlighted(-1);
  };

  const commitFreeText = () => {
    const trimmed = inputValue?.trim();
    if (trimmed) onChange(trimmed);
  };

  const clearInput = () => {
    setInputValue("");
    onChange("");
    setOpen(false);
    inputRef.current?.focus();
  };

  // ── Keyboard navigation ────────────────────────────────────────────────────

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!shouldShowDropdown) {
      if (e.key === "Enter") {
        commitFreeText();
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlighted((prev) => Math.min(prev + 1, Math.min(filtered.length, 5) - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlighted((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (highlighted >= 0 && filtered[highlighted]) {
          selectOption(filtered[highlighted]);
        } else {
          commitFreeText();
          setOpen(false);
        }
        break;
      case "Escape":
        setOpen(false);
        break;
      case "Tab":
        commitFreeText();
        setOpen(false);
        break;
    }
  };

  // Scroll highlighted item into view
  React.useEffect(() => {
    if (highlighted >= 0 && listRef.current) {
      const item = listRef.current.children[highlighted] as HTMLElement;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [highlighted]);

  const isExactMatch = options?.some(
    (o) => o.name?.toLowerCase() === inputValue?.toLowerCase()
  );


  return (
    <div className="space-y-2" ref={containerRef}>
      {label && (
        <Label htmlFor={id} className="text-base text-white/80 font-semibold">
          {label}
          {required && <span className="text-destructive"> *</span>}
        </Label>
      )}

      <div className="relative">
        <Input
          disabled={disabled}
          ref={inputRef}
          id={id}
          autoComplete="off"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setOpen(true);
            setHighlighted(-1);
          }}
          onKeyDown={handleKeyDown}
          className={cn(
            "h-12 pr-10 text-white",
            error ? "border-destructive" : "border-primary-orange"
          )}
        />

        {/* Clear button — only when there's input */}
        {inputValue && (
          <button
            type="button"
            onClick={clearInput}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors p-0.5"
            aria-label="Clear"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Dropdown — only when typing + matches exist */}
        {shouldShowDropdown && (
          <div className="absolute z-[99999] mt-1 w-full rounded-md border border-primary-orange/40 bg-[#1a1a1a] shadow-xl overflow-hidden">
            {/* Free-text hint when no exact match */}
            {!isExactMatch && (
              <div className="px-3 py-2 text-xs text-white/40 border-b border-white/10 flex items-center gap-1.5">
                <span>Press Enter to use</span>
                <span className="text-primary-orange font-medium">
                  {inputValue.trim()}
                </span>
              </div>
            )}

            {/* Limit to 5 visible rows via max-h on the ul */}
            <ul
              ref={listRef}
              className="overflow-y-auto divide-y divide-white/5"
              style={{ maxHeight: "calc(5 * 40px)" }}
              role="listbox"
            >
              {filtered.map((option, idx) => {
                const hovered = idx === highlighted;

                return (
                  <li
                    key={option._id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectOption(option);
                    }}
                    onMouseEnter={() => setHighlighted(idx)}
                    className={cn(
                      "flex items-center justify-between px-3 py-3 cursor-pointer transition-colors min-h-[52px]",
                      hovered && "bg-white/5"
                    )}
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm text-white font-medium truncate">
                        {option.name}
                      </span>
                      {option.description && (
                        <span className="text-xs text-white/40 truncate">
                          {option.description}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}