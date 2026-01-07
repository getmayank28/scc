"use client";
import { signInSchema } from "@/schemas/signInSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useState } from "react";
import toast from "react-hot-toast";
import SignInWithGoogle from "@/components/SignInWithGoogle/SignInWithGoogle";
import ForgetPassword from "../ForgetPassword/ForgetPassword";
import { X } from "lucide-react";
import { useSignInControl } from "@/contexts/SignInContext";

const SignInSection = ({
  showSkip = false,
  onSkip,
}: {
  showSkip?: boolean;
  onSkip?: () => void;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { closeSignUpModal } = useSignInControl();
  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof signInSchema>) => {
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email: data.identifier.trim(),
        password: data.password,
      });

      if (result?.error) {
        const message = result?.error || "Failed to sign-in";
        toast.error(message);
      }
    } catch (error) {
      toast.error("Something went wrong");
      console.log("Sign-in error", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative z-10 w-[545px] bg-background-primary p-12 px-14 pb-0 rounded-2xl border border-white/20">
      {showSkip && (
        <div
          onClick={closeSignUpModal}
          className="absolute cursor-pointer top-3 right-3 border border-white p-1 rounded-full"
        >
          <X color="#fff" size={20} />
        </div>
      )}
      <h1 className="text-[#FFF] text-center relative z-[100] font-butlerpro text-[40px] font-medium leading-[110%]">
        Sign In
      </h1>
      <p className="text-white opacity-70 relative z-[100] text-center font-satoshi text-[14px]  font-normal leading-[150%] tracking-[-2%] [font-feature-settings:'ss03_on']">
        Access your account to continue.
      </p>
      <SignInWithGoogle />
      <Form {...form}>
        <form
          className="flex flex-col gap-6 mt-10"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FormField
            control={form.control}
            name="identifier"
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
          <div>
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      className="h-12 text-white border-white/30"
                      type="password"
                      placeholder="Password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <ForgetPassword form={form} />
          </div>

          <div>
            <Button
              className="w-full rounded-full h-12 cursor-pointer bg-primary-orange/70 hover:bg-primary-orange"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex gap-2 items-center">
                  <Spinner />
                  <span>Verifying email</span>
                </div>
              ) : (
                "Sign in"
              )}
            </Button>
          </div>
        </form>
      </Form>
      <div className="flex justify-end py-8">
        {showSkip && (
          <p
            className="text-white/70 text-[12px] cursor-pointer"
            onClick={onSkip}
          >
            Skip for now
          </p>
        )}
      </div>
    </div>
  );
};

export default SignInSection;
