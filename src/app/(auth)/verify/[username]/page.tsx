"use client";
import ChangeEmail from "@/components/ChangeEmail/ChangeEmail";
import ResendOTP from "@/components/ResendOTP/ResendOTP";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  Form,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { trackEvent } from "@/lib/analytics/track";
import { EventName } from "@/lib/analytics/types";
import { ROUTES } from "@/lib/constants/routes";
import { decodeBase64 } from "@/lib/utils/encodeDecode";
import { verifySchema } from "@/schemas/verifySchema";
import { useVerifyCodeMutation } from "@/store/api";
import { APIFailure } from "@/types/ApiResponse";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import z from "zod";

const VerifyAccount = () => {
  const router = useRouter();
  const params = useParams();


  const email = decodeBase64(params.username as string)


  const form = useForm<z.infer<typeof verifySchema>>({
    resolver: zodResolver(verifySchema),
  });

  const [verifyCode, { data, isLoading, error }] = useVerifyCodeMutation();

  useEffect(() => {
    trackEvent(EventName.EMAIL_VERIFY_PAGE_VIEWED, {
      hasEmail: Boolean(email),
    });
  }, [email]);

  useEffect(() => {
    if (data && data?.success) {
      toast.success("Successfully verified email");
      trackEvent(EventName.EMAIL_VERIFY_SUCCEEDED, {});
      router.replace(ROUTES.DASHBOARD);
    }
    if (error && (error as APIFailure)?.status) {
      const message =
        (error as APIFailure)?.data?.message || "Failed to verify email";
      toast.error(message);
      trackEvent(EventName.EMAIL_VERIFY_FAILED, { reason: message });
    }
  }, [(error as APIFailure)?.status, data?.success]);

  const onSubmit = async (data: z.infer<typeof verifySchema>) => {
    const body = {
      username: email,
      code: data.code,
    };
    trackEvent(EventName.EMAIL_VERIFY_SUBMITTED, {});
    await verifyCode(body);
  };

  return (
    <div className="h-screen relative overflow-hidden bg-background-primary flex items-center justify-center">
      <div className="absolute rotate-[60deg] -top-[50%] -left-[8%] w-200 h-200 rounded-[120px] bg-secondary-orange/30"></div>
      <div className="absolute rotate-[60deg] -bottom-[50%] -right-[8%] w-200 h-200 rounded-[120px] bg-secondary-orange/30"></div>
      <div className="relative z-10 max-md:w-[345px] max-md:px-6 w-[545px] bg-background-primary p-12 px-14 rounded-2xl border border-white/20">
        <h1 className="text-[#FFF] text-center relative z-[100] font-butlerpro text-[40px] font-medium leading-[110%]">
          Verify Your Email
        </h1>
        <p className="text-white opacity-70 relative z-[100] text-center font-satoshi text-[14px]  font-normal leading-[150%] tracking-[-2%] [font-feature-settings:'ss03_on']">
          Enter the verification code <br className="hidden max-md:inline"/>we sent to your email.
        </p>
       
        <Form {...form}>
          <form className="mt-10 max-md:mt-4" onSubmit={form.handleSubmit(onSubmit)}>
          <ChangeEmail email={email} />
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      className="h-12 text-white border-white/30"
                      placeholder="Verification code"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
              <ResendOTP email={email} />
            <Button
              className="w-full mt-6 rounded-full h-12 cursor-pointer bg-primary-orange/70 hover:bg-primary-orange"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex gap-2 items-center">
                  <Spinner />
                  <span>Verifying email</span>
                </div>
              ) : (
                "Submit"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default VerifyAccount;
