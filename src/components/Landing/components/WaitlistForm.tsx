"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import z from "zod";
import { useWaitlistMutation } from "@/store/api";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { X } from "lucide-react";
import { useWaitlistControl } from "@/contexts/WaitlistContext";
import { trackEvent } from "@/lib/analytics/track";
import { EventName } from "@/lib/analytics/types";


export const waitlistSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address"),
  mobile: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => !val || /^[0-9]{7,15}$/.test(val),
      "Please enter a valid mobile number"
    ),
});

const WaitlistForm = () => {

  const [addToWaitlist, { isLoading }] = useWaitlistMutation();
  const {closeWaitlistModal} = useWaitlistControl()

  const form = useForm<z.infer<typeof waitlistSchema>>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: {
      email: "",
      mobile: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof waitlistSchema>) => {
    trackEvent(EventName.BUTTON_CLICKED, {
      buttonName: EventName.JOIN_WAITLIST_BTN,
      location: EventName.LANDING_PAGE,
    });
    try {
      await addToWaitlist(data).unwrap();
      toast.success("You're on the waitlist 🎉");
      form.reset();
      closeWaitlistModal?.()
    } catch (error: unknown) {
      if (error && typeof error === "object" && "data" in error) {
        const fetchError = error as FetchBaseQueryError;
        const errorData = fetchError.data as { message?: string };
        toast.error(errorData?.message || "Failed to join waitlist");
      } else {
        toast.error("Failed to join waitlist");
      }
    }
  };

  return (
    <div className="relative z-10 max-md:w-full w-[545px] max-md:px-6 bg-background-primary p-12 px-14 pb-10 rounded-2xl border border-white/20">
        <div onClick={closeWaitlistModal} className="absolute cursor-pointer top-3 right-3 border border-white p-1 rounded-full">
            <X color="#fff" size={20}/>
        </div>
      <h1 className="text-[#FFF] text-center text-[40px] font-bold leading-[110%]">
        Get early access
      </h1>

      <p className="text-white mt-2 opacity-70 text-center text-[14px] leading-[150%]">
        Be among the first to experience what’s next.
      </p>

      <Form {...form}>
        <form
          className="flex flex-col gap-6 mt-10"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          {/* Email (Required) */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    className="h-12 text-white border-white/30"
                    placeholder="Email Address"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Mobile Number (Optional) */}
          <FormField
            control={form.control}
            name="mobile"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    className="h-12 text-white border-white/30"
                    placeholder="Mobile Number"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            className="w-full rounded-full h-12 bg-primary-orange/70 hover:bg-primary-orange"
            type="submit"
            disabled={isLoading}
          >
            {isLoading?'Adding into waitlist':'Notify me First'}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default WaitlistForm;
