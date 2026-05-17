"use client";
import toast from "react-hot-toast";
import Typography from "../Typography/Typography";
import { useSendVerificationCodeMutation } from "@/store/api";
import { Spinner } from "../ui/spinner";
import { useState, useEffect } from "react";
import { trackEvent } from "@/lib/analytics/track";
import { EventName } from "@/lib/analytics/types";

const ResendOTP = ({ email }: { email: string }) => {
  const [sendVerificationCode, { isLoading }] =
    useSendVerificationCodeMutation();

  const [timer, setTimer] = useState(45);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [timer]);

  const handleResend = async () => {
    if (timer > 0) return; // prevent clicking while countdown active

    trackEvent(EventName.EMAIL_VERIFY_RESEND_CLICKED, {});

    try {
      const response = await sendVerificationCode({ email });

      if (response?.data?.success) {
        toast.success(response?.data?.message);
        trackEvent(EventName.EMAIL_VERIFY_RESEND_SUCCEEDED, {});
        setTimer(45);
      } else {
        toast.error("Failed to send verification email");
        trackEvent(EventName.EMAIL_VERIFY_RESEND_FAILED, {
          reason: "send_returned_unsuccessful",
        });
      }
    } catch {
      toast.error("Failed to send verification email");
      trackEvent(EventName.EMAIL_VERIFY_RESEND_FAILED, {
        reason: "network_error",
      });
    }
  };

  return (
    <Typography
      variant="caption"
      className={`text-left my-2 cursor-pointer ${
        timer > 0 ? "pointer-events-none opacity-50" : "font-bold"
      }`}
      onClick={handleResend}
    >
      {isLoading ? (
        <Spinner />
      ) : timer > 0 ? (
        `Resend OTP in ${timer}s`
      ) : (
        "Resend OTP"
      )}
    </Typography>
  );
};

export default ResendOTP;
