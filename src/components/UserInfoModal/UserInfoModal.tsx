"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { CheckCircle2, Loader2, Pencil} from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils/index";
import { indianPhoneRegex, SALARY_RANGES } from "@/schemas/userInfoSchema";
import { useUpdateUserInfoMutation } from "@/store/userApi";

type OtpState = "idle" | "sending" | "sent" | "verifying" | "verified";

interface FormState {
  phoneNumber: string;
  otp: string;
  salaryRange: string;
  informationConsent: boolean;
  promotionalConsent: boolean;
}

interface FieldError {
  phoneNumber?: string;
  otp?: string;
  salaryRange?: string;
}

// ─── OTP Input ────────────────────────────────────────────────────────────────

function OtpInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
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

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { inputs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i] ?? ""}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
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

function ResendCountdown({
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


interface UserInfoModalProps {
  onSuccess?: () => void;
}

export default function UserInfoModal({ onSuccess }: UserInfoModalProps) {
  const { update } = useSession();
  const [form, setForm] = useState<FormState>({
    phoneNumber: "",
    otp: "",
    salaryRange: "",
    informationConsent: true,
    promotionalConsent: true,
  });

  const [errors, setErrors] = useState<FieldError>({});
  const [otpState, setOtpState] = useState<OtpState>("idle");
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [retryAfter, setRetryAfter] = useState(60);

  const [updateUserInfo, { isLoading: isSaving }] = useUpdateUserInfoMutation();


  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validatePhone = useCallback((): boolean => {
    if (!indianPhoneRegex.test(form.phoneNumber)) {
      setErrors((prev) => ({
        ...prev,
        phoneNumber: "Enter a valid 10-digit Indian mobile number",
      }));
      return false;
    }
    return true;
  }, [form.phoneNumber]);


  const handleSendOtp = useCallback(async () => {
    if (!validatePhone()) return;
    setOtpState("sending");
    try {
      const res = await fetch("/api/communication/whatsapp/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: form.phoneNumber }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to send OTP");
        setOtpState("idle");
        return;
      }

      setRetryAfter(data.retryAfter ?? 60);
      setOtpState("sent");
      toast.success("OTP sent to your WhatsApp number");
    } catch {
      toast.error("Network error. Please try again.");
      setOtpState("idle");
    }
  }, [form.phoneNumber, validatePhone]);

  // ── Edit Phone ─────────────────────────────────────────────────────────────

  const handleEditPhone = useCallback(() => {
    setOtpState("idle");
    setField("otp", "");
    setVerificationToken(null);
  }, []);

  // ── Verify OTP ──────────────────────────────────────────────────────────────

  const handleVerifyOtp = useCallback(async () => {
    if (form.otp.length !== 6) {
      setErrors((prev) => ({ ...prev, otp: "Enter the 6-digit OTP" }));
      return;
    }
    setOtpState("verifying");
    try {
      const res = await fetch("/api/communication/whatsapp/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: form.phoneNumber, otp: form.otp }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrors((prev) => ({ ...prev, otp: data.message }));
        setOtpState("sent");
        return;
      }

      setVerificationToken(data.verificationToken);
      setOtpState("verified");
      toast.success("WhatsApp number verified!");
    } catch {
      toast.error("Network error. Please try again.");
      setOtpState("sent");
    }
  }, [form.otp, form.phoneNumber]);

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: FieldError = {};
    if (otpState !== "verified" || !verificationToken) {
      newErrors.phoneNumber = "Please verify your WhatsApp number first";
    }
    if (!form.salaryRange) {
      newErrors.salaryRange = "Please select your salary range";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await updateUserInfo({
        verificationToken: verificationToken!,
        salaryRange: form.salaryRange as never,
        informationConsent: form.informationConsent,
        promotionalConsent: form.promotionalConsent,
      }).unwrap();
      toast.success("Profile updated successfully!");
      // Refresh the JWT so middleware sees hasCompletedUserInfo = true
      await update();
      onSuccess?.();
    } catch {
      toast.error("Failed to save your information. Please try again.");
    }
  };

  const isPhoneVerified = otpState === "verified";
  const isOtpSent = otpState === "sent" || otpState === "verifying";
  const isSendingOtp = otpState === "sending";
  const isVerifyingOtp = otpState === "verifying";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-primary-orange">
          <h2 className="text-lg font-semibold text-white">Complete Your Profile</h2>
        </div>
        <p className="text-sm text-white/60">
          Help us personalise your card recommendations.
        </p>
      </div>

      {/* Phone Number */}
      <div className="flex flex-col gap-2">
        <Label className="text-white/80 text-sm font-medium">
          WhatsApp Mobile Number <span className="text-destructive">*</span>
        </Label>
        <div className="flex gap-1 items-start">
          {/* Country prefix */}
          <div className="flex items-center h-12 px-3 rounded-md border border-brown-border bg-brown-background text-white/60 text-sm shrink-0 select-none">
            +91
          </div>
          <div className="flex-1">
            <Input
              type="tel"
              inputMode="numeric"
              placeholder="10-digit number"
              maxLength={10}
              value={form.phoneNumber}
              onChange={(e) =>
                setField("phoneNumber", e.target.value.replace(/\D/g, ""))
              }
              disabled={isPhoneVerified || isSendingOtp || isOtpSent}
              aria-invalid={!!errors.phoneNumber}
              className={cn(
                "bg-brown-background text-white border-brown-border h-12",
                "placeholder:text-white/30",
                isPhoneVerified && "border-secondary-success text-secondary-success opacity-100"
              )}
              rightIcon={
                isPhoneVerified ? (
                  <CheckCircle2 className="size-4 text-secondary-success" />
                ) : undefined
              }
            />
          </div>
          {!isPhoneVerified && (
            isOtpSent ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleEditPhone}
                className="shrink-0 h-11 text-sm border-brown-border text-white/70 hover:bg-brown-border/20"
              >
                <Pencil className="size-3.5 mr-1" /> Edit
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSendOtp}
                disabled={isSendingOtp}
                className="shrink-0 h-11 text-sm border-primary-orange text-primary-orange hover:bg-primary-orange/10"
              >
                {isSendingOtp ? <Loader2 className="size-4 animate-spin" /> : "Send OTP"}
              </Button>
            )
          )}
        </div>
        {errors.phoneNumber && (
          <p className="text-destructive text-xs">{errors.phoneNumber}</p>
        )}
      </div>

      {/* OTP Input Section */}
      {isOtpSent && (
        <div className="flex flex-col gap-3 p-4 rounded-xl border border-brown-border bg-brown-background/60">
          <p className="text-sm text-white/70 text-center">
            Enter the 6-digit OTP sent to{" "}
            <span className="text-white font-medium">+91 {form.phoneNumber}</span>
          </p>
          <OtpInput
            value={form.otp}
            onChange={(v) => setField("otp", v)}
            disabled={isVerifyingOtp}
          />
          {errors.otp && (
            <p className="text-destructive text-xs text-center">{errors.otp}</p>
          )}
          <Button
            type="button"
            onClick={handleVerifyOtp}
            disabled={form.otp.length !== 6 || isVerifyingOtp}
            className="w-full"
            size="sm"
          >
            {isVerifyingOtp ? (
              <><Loader2 className="size-4 animate-spin" /> Verifying…</>
            ) : (
              "Verify OTP"
            )}
          </Button>
          <ResendCountdown
            retryAfter={retryAfter}
            onResend={handleSendOtp}
            disabled={isSendingOtp}
          />
        </div>
      )}

      {/* Salary Range */}
      <div className="flex flex-col gap-2">
        <Label className="text-white/80 text-sm font-medium">
          Annual Salary Range <span className="text-destructive">*</span>
        </Label>
        <Select
          value={form.salaryRange}
          onValueChange={(v) => setField("salaryRange", v)}
        >
          <SelectTrigger
            className={cn(
              "w-full bg-brown-background text-white border-brown-border h-12!",
              "data-[placeholder]:text-white/30",
              errors.salaryRange && "border-destructive"
            )}
          >
            <SelectValue placeholder="Select your annual income" />
          </SelectTrigger>
          <SelectContent>
            {SALARY_RANGES.map((range) => (
              <SelectItem key={range.value} value={range.value}>
                {range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.salaryRange && (
          <p className="text-destructive text-xs">{errors.salaryRange}</p>
        )}
      </div>

     <div>
     <div className="flex flex-col gap-3 p-4 px-0">
        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox
            id="informationConsent"
            checked={form.informationConsent}
            onCheckedChange={(checked) =>
              setField("informationConsent", checked === true)
            }
            className="mt-0.5 border-primary-orange data-[state=checked]:bg-primary-orange data-[state=checked]:text-white"
          />
          <div className="flex flex-col gap-0.5">
            {/* <span className="text-sm text-white font-medium">
              Card information updates
            </span> */}
            <span className="text-xs text-white/90">
              Receive credit card tips, news, and benefit alerts via WhatsApp.
            </span>
          </div>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox
            id="promotionalConsent"
            checked={form.promotionalConsent}
            onCheckedChange={(checked) =>
              setField("promotionalConsent", checked === true)
            }
            className="mt-0.5 border-primary-orange data-[state=checked]:bg-primary-orange data-[state=checked]:text-white"
          />
          <div className="flex flex-col gap-0.5">
            {/* <span className="text-sm text-white font-medium">
              Promotional messages
            </span> */}
            <span className="text-xs text-white/90">
              Get exclusive offers, best deals, and limited-time promotions.
            </span>
          </div>
        </label>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        size="lg"
        disabled={isSaving || !isPhoneVerified}
        className="w-full"
      >
        {isSaving ? (
          <><Loader2 className="size-4 animate-spin" /> Saving…</>
        ) : (
          <>
            Save 
          </>
        )}
      </Button>
     </div>

      <p className="text-center text-xs text-white/40">
        Your data is encrypted and never shared with third parties.
      </p>

      <p className="text-center text-xs text-white/40">
        Don&apos;t want to continue?{" "}
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-white/60 underline underline-offset-2 hover:text-white transition-colors"
        >
          Sign out
        </button>
      </p>
    </form>
  );
}
