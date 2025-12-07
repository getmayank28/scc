"use client";
import toast from "react-hot-toast";
import Typography from "../Typography/Typography";
import { useSendVerificationCodeMutation } from "@/store/api";
import { Spinner } from "../ui/spinner";
import { useState, useEffect } from "react";

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

    try {
      const response = await sendVerificationCode({ email });

      if (response?.data?.success) {
        toast.success(response?.data?.message);
        setTimer(45);
      } else {
        toast.error("Failed to send verification email");
      }
    } catch {
      toast.error("Failed to send verification email");
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
