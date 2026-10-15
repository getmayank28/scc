"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/index";

// ─── OTP Input ────────────────────────────────────────────────────────────────

export function OtpInput({
  value,
  onChange,
  disabled,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(6, "").split("").slice(0, 6);

  const focusNext = (index: number) => {
    if (index < 5) inputs.current[index + 1]?.focus();
  };
  const focusPrev = (index: number) => {
    if (index > 0) inputs.current[index - 1]?.focus();
  };

  const handleChange = (index: number, char: string) => {
    if (!/^\d?$/.test(char)) return;
    const next = digits.slice();
    next[index] = char;
    const joined = next.join("").replace(/\s/g, "");
    onChange(joined);
    if (char) focusNext(index);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index]) focusPrev(index);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted);
    inputs.current[Math.min(pasted.length, 5)]?.focus();
  };

  // OS autofill ("one-time-code") drops the whole code into the first box.
  const handleFirstInput = (char: string) => {
    const code = char.replace(/\D/g, "");
    if (code.length >= 6) {
      onChange(code.slice(0, 6));
      inputs.current[5]?.focus();
      return;
    }
    // Typing over a filled box: keep only the newest digit.
    handleChange(0, code.slice(-1));
  };

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { inputs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={i === 0 ? 6 : 1}
          autoComplete={i === 0 ? "one-time-code" : "off"}
          autoFocus={autoFocus && i === 0}
          aria-label={`Digit ${i + 1}`}
          value={digits[i] ?? ""}
          disabled={disabled}
          onChange={(e) =>
            i === 0 ? handleFirstInput(e.target.value) : handleChange(i, e.target.value)
          }
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className={cn(
            "w-10 h-12 text-center text-lg font-semibold rounded-lg border",
            "bg-brown-background text-white border-brown-border",
            "focus:outline-none focus:border-primary-orange focus:ring-1 focus:ring-primary-orange",
            "transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        />
      ))}
    </div>
  );
}

// ─── Resend Countdown ─────────────────────────────────────────────────────────

export function ResendCountdown({
  retryAfter,
  onResend,
  disabled,
}: {
  retryAfter: number;
  onResend: () => void;
  disabled: boolean;
}) {
  const [remaining, setRemaining] = useState(retryAfter);

  useEffect(() => {
    setRemaining(retryAfter);
    if (retryAfter <= 0) return;
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [retryAfter]);

  return (
    <div className="text-center">
      {remaining > 0 ? (
        <span className="text-sm text-white/50">
          Resend OTP in{" "}
          <span className="text-primary-orange font-medium">{remaining}s</span>
        </span>
      ) : (
        <button
          type="button"
          onClick={onResend}
          disabled={disabled}
          className="text-sm text-primary-orange underline underline-offset-2 cursor-pointer disabled:opacity-50"
        >
          Resend OTP
        </button>
      )}
    </div>
  );
}
