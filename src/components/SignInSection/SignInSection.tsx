"use client";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { OtpInput, ResendCountdown } from "@/components/OtpInput/OtpInput";
import { useSignInControl } from "@/contexts/SignInContext";
import { trackEvent } from "@/lib/analytics/track";
import { EventName } from "@/lib/analytics/types";
import { ROUTES } from "@/lib/constants/routes";
import { indianPhoneRegex } from "@/schemas/userInfoSchema";

type Step = "phone" | "otp";

const SignInSection = ({
  showSkip = false,
  onSkip,
}: {
  showSkip?: boolean;
  onSkip?: () => void;
}) => {
  const router = useRouter();
  const { closeSignUpModal } = useSignInControl();
  const [step, setStep] = useState<Step>("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [consent, setConsent] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [retryAfter, setRetryAfter] = useState(60);
  // Bumped per send so the resend countdown restarts even when retryAfter repeats.
  const [sendCount, setSendCount] = useState(0);

  useEffect(() => {
    trackEvent(EventName.SIGNIN_PAGE_VIEWED, {});
  }, []);

  const sendOtp = useCallback(
    async (isResend: boolean) => {
      trackEvent(
        isResend
          ? EventName.WHATSAPP_OTP_RESEND_CLICKED
          : EventName.WHATSAPP_OTP_SEND_CLICKED,
        { phoneProvided: Boolean(phoneNumber) },
      );

      if (!indianPhoneRegex.test(phoneNumber)) {
        setError("Enter a valid 10-digit Indian mobile number");
        trackEvent(EventName.WHATSAPP_OTP_SEND_FAILED, {
          phoneProvided: Boolean(phoneNumber),
          reason: "invalid_phone",
        });
        return;
      }

      setError(null);
      setIsSending(true);
      try {
        const res = await fetch("/api/otp/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phoneNumber }),
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.message || "Failed to send OTP");
          trackEvent(EventName.WHATSAPP_OTP_SEND_FAILED, {
            phoneProvided: true,
            reason: data.message || `http_${res.status}`,
          });
          return;
        }

        setRetryAfter(data.retryAfter ?? 60);
        setSendCount((n) => n + 1);
        setOtp("");
        setStep("otp");
        toast.success("OTP sent on WhatsApp");
        trackEvent(EventName.WHATSAPP_OTP_SEND_SUCCEEDED, {
          phoneProvided: true,
          retryAfter: data.retryAfter ?? 60,
        });
      } catch {
        setError("Network error. Please try again.");
        trackEvent(EventName.WHATSAPP_OTP_SEND_FAILED, {
          phoneProvided: true,
          reason: "network_error",
        });
      } finally {
        setIsSending(false);
      }
    },
    [phoneNumber],
  );

  const verifyOtp = useCallback(
    async (code: string) => {
      if (code.length !== 6 || isVerifying) return;

      setError(null);
      setIsVerifying(true);
      trackEvent(EventName.SIGNIN_SUBMITTED, { method: "whatsapp_otp" });
      try {
        // Drop the previous visitor's chat stash before a new user lands.
        localStorage.clear();
        const result = await signIn("whatsapp-otp", {
          phoneNumber,
          otp: code,
          consent: String(consent),
          redirect: false,
        });

        if (result?.error) {
          setError(result.error);
          setOtp("");
          trackEvent(EventName.SIGNIN_FAILED, {
            method: "whatsapp_otp",
            reason: result.error,
          });
          return;
        }

        trackEvent(EventName.SIGNIN_SUCCEEDED, { method: "whatsapp_otp" });
        // Honour a post-login destination when one was passed in (e.g. the sale
        // funnel routes here via ?callbackUrl=/sale/continue). Only same-origin
        // relative paths are allowed, to avoid an open-redirect.
        const callbackUrl = new URLSearchParams(window.location.search).get(
          "callbackUrl",
        );
        const destination =
          callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
            ? callbackUrl
            : ROUTES.LOGGED_IN_HOME;
        closeSignUpModal();
        router.push(destination);
        router.refresh();
      } catch {
        setError("Something went wrong. Please try again.");
        trackEvent(EventName.SIGNIN_FAILED, {
          method: "whatsapp_otp",
          reason: "exception",
        });
      } finally {
        setIsVerifying(false);
      }
    },
    [phoneNumber, consent, isVerifying, closeSignUpModal, router],
  );

  const handleOtpChange = (value: string) => {
    setOtp(value);
    setError(null);
    // Submit as soon as the last digit lands — no extra tap.
    if (value.length === 6) verifyOtp(value);
  };

  const handleEditPhone = () => {
    trackEvent(EventName.WHATSAPP_OTP_EDIT_PHONE_CLICKED, {});
    setStep("phone");
    setOtp("");
    setError(null);
  };

  const handleClose = () => {
    trackEvent(EventName.SIGNIN_MODAL_CLOSED, {});
    closeSignUpModal();
  };

  const handleSkip = () => {
    trackEvent(EventName.SIGNIN_SKIP_CLICKED, {});
    onSkip?.();
  };

  return (
    <div className="relative z-10 max-md:w-[345px] max-md:px-6 max-md:mx-6 w-[545px] bg-background-primary p-12 px-14 pb-0 rounded-2xl border border-white/20">
      {showSkip && (
        <div
          onClick={handleClose}
          className="absolute cursor-pointer top-3 right-3 border border-white p-1 rounded-full"
        >
          <X color="#fff" size={20} />
        </div>
      )}
      <h1 className="text-[#FFF] text-center relative z-[100] font-butlerpro text-[40px] font-medium leading-[110%]">
        {step === "phone" ? "Sign In" : "Enter OTP"}
      </h1>
      <p className="text-white opacity-70 relative z-[100] text-center font-satoshi text-[14px] font-normal leading-[150%] tracking-[-2%] [font-feature-settings:'ss03_on']">
        {step === "phone" ? (
          "Enter your WhatsApp number to continue."
        ) : (
          <>
            Sent on WhatsApp to <span className="text-white font-medium">+91 {phoneNumber}</span>
          </>
        )}
      </p>

      {step === "phone" ? (
        <form
          className="flex flex-col gap-6 mt-10"
          onSubmit={(e) => {
            e.preventDefault();
            sendOtp(false);
          }}
        >
          <div className="flex gap-2 items-start">
            <div className="flex items-center h-12 px-3 rounded-md border border-white/30 text-white/60 text-sm shrink-0 select-none">
              +91
            </div>
            <Input
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              autoFocus
              maxLength={10}
              placeholder="WhatsApp mobile number"
              aria-label="WhatsApp mobile number"
              aria-invalid={!!error}
              value={phoneNumber}
              onChange={(e) => {
                setPhoneNumber(e.target.value.replace(/\D/g, ""));
                setError(null);
              }}
              className="h-12 text-white border-white/30"
            />
          </div>
          {error && <p className="text-destructive text-xs -mt-4">{error}</p>}
          <label className="flex items-start gap-3 cursor-pointer -mt-1">
            <Checkbox
              checked={consent}
              onCheckedChange={(checked) => setConsent(checked === true)}
              aria-label="Accept terms and WhatsApp messages"
              className="mt-0.5 border-primary-orange data-[state=checked]:bg-primary-orange data-[state=checked]:text-white"
            />
            <span className="text-xs text-white/70 leading-relaxed">
              I agree to the{" "}
              <Link href={ROUTES.TERMS} className="underline text-white">
                Terms
              </Link>{" "}
              &{" "}
              <Link href={`/${ROUTES.PRIVACY_POLICY}`} className="underline text-white">
                Privacy Policy
              </Link>{" "}
              and to receive card tips, reward alerts and offers on WhatsApp.
            </span>
          </label>
          <Button
            className="w-full rounded-full h-12 cursor-pointer bg-primary-orange/70 hover:bg-primary-orange"
            type="submit"
            disabled={isSending || phoneNumber.length !== 10 || !consent}
          >
            {isSending ? (
              <div className="flex gap-2 items-center">
                <Spinner />
                <span>Sending OTP</span>
              </div>
            ) : (
              "Get OTP on WhatsApp"
            )}
          </Button>
        </form>
      ) : (
        <div className="flex flex-col gap-5 mt-10">
          <OtpInput
            value={otp}
            onChange={handleOtpChange}
            disabled={isVerifying}
            autoFocus
          />
          {error && <p className="text-destructive text-xs text-center">{error}</p>}
          <Button
            className="w-full rounded-full h-12 cursor-pointer bg-primary-orange/70 hover:bg-primary-orange"
            type="button"
            onClick={() => verifyOtp(otp)}
            disabled={isVerifying || otp.length !== 6}
          >
            {isVerifying ? (
              <div className="flex gap-2 items-center">
                <Spinner />
                <span>Verifying</span>
              </div>
            ) : (
              "Verify & continue"
            )}
          </Button>
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={handleEditPhone}
              className="flex items-center gap-1 text-sm text-white/60 hover:text-white cursor-pointer"
            >
              <Pencil className="size-3.5" /> Change number
            </button>
            <ResendCountdown
              key={sendCount}
              retryAfter={retryAfter}
              onResend={() => sendOtp(true)}
              disabled={isSending}
            />
          </div>
        </div>
      )}

      <div className="flex justify-end py-8">
        {showSkip && (
          <p
            className="text-white/70 text-[12px] cursor-pointer"
            onClick={handleSkip}
          >
            Skip for now
          </p>
        )}
      </div>
    </div>
  );
};

export default SignInSection;
