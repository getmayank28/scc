"use client";
import Checkmark from "@/components/CheckMark/CheckMark";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { ROUTES } from "@/lib/constants/routes";
import { signUpSchema } from "@/schemas/signUpSchema";
import {
  useCreateAccountMutation,
  useLazyCheckUsernameAvailabilityQuery,
} from "@/store/api";
import { APIFailure } from "@/types/ApiResponse";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useDebounceCallback } from "usehooks-ts";
import z from "zod";

const SignUp = () => {
  const [username, setUsername] = useState("");
  const router = useRouter();

  const debounseUsername = useDebounceCallback(setUsername, 800);

  const [
    checkUsername,
    {
      data: usernameData,
      error: usernameError,
      isFetching: isCheckingUsername,
    },
  ] = useLazyCheckUsernameAvailabilityQuery();
  const [
    createAccount,
    {
      isLoading: isCreatingAccount,
      error: createAccountError,
      data: createAccountData,
    },
  ] = useCreateAccountMutation();

  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (username && username?.length > 3) {
      checkUsername({ username });
    }
    if (usernameError && (usernameError as APIFailure)?.status) {
      const message =
        (usernameError as APIFailure)?.data?.message ||
        "Failed to check username";
      form.setError("username", {
        type: "error",
        message: message,
      });
    }
    if (usernameData?.success) {
      form.clearErrors("username");
    }
  }, [username, usernameError?.status, usernameData?.success]);

  useEffect(() => {
    if (createAccountData && createAccountData?.success) {
      toast.success("Successfully send verification email");

      router.replace("/verify/" + username);
    }
    if (createAccountError && (createAccountError as APIFailure)?.status) {
      const message =
        (createAccountError as APIFailure)?.data?.message ||
        "Failed to create account";
      toast.error(message);
    }
  }, [(createAccountError as APIFailure)?.status, createAccountData?.success]);

  const onSubmit = async (data: z.infer<typeof signUpSchema>) => {
    await createAccount(data);
  };

  return (
    <div className="h-screen relative overflow-hidden bg-background-primary flex items-center justify-center">
      <div className="absolute rotate-[60deg] -top-[50%] -left-[8%] w-200 h-200 rounded-[120px] bg-secondary-orange/30"></div>
      <div className="absolute rotate-[60deg] -bottom-[50%] -right-[8%] w-200 h-200 rounded-[120px] bg-secondary-orange/30"></div>
      <div className="relative z-10 w-120 bg-background-primary p-12 px-14 pb-0 rounded-2xl border border-white/20">
        <h1 className="text-[#FFF] text-center relative z-[100] font-butlerpro text-[40px] font-medium leading-[110%]">
          Create An Account
        </h1>
        <p className="text-white opacity-70 relative z-[100] text-center font-satoshi text-[14px]  font-normal leading-[150%] tracking-[-2%] [font-feature-settings:'ss03_on']">
          Create an account to enjoy all the services
          <br /> without any ads for free!
        </p>
        <Form {...form}>
          <form
            className="flex flex-col gap-6 mt-10"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      className="h-12 text-white border-white/30"
                      placeholder="Username"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        debounseUsername(e.target.value);
                      }}
                      rightIcon={
                        isCheckingUsername ? (
                          <Spinner className="size-6 text-white" />
                        ) : usernameData?.success ? (
                          <Checkmark />
                        ) : null
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
            <div>
              <Button
                className="w-full rounded-full h-12 cursor-pointer bg-primary-orange/70 hover:bg-primary-orange"
                type="submit"
                disabled={isCreatingAccount}
              >
                {isCreatingAccount ? (
                  <div className="flex gap-2 items-center">
                    <Spinner />
                    <span>Creating Account</span>
                  </div>
                ) : (
                  "Let's Go!"
                )}
              </Button>
              <p className="text-white mt-2 opacity-70 relative z-[100] text-center font-satoshi  text-[14px] font-normal leading-[150%] tracking-[-2%]  [font-feature-settings:'ss03_on']">
                Already have an account?
                <Link
                  className="underline text-white !opacity-100 ml-1"
                  href={ROUTES.SIGN_IN}
                >
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </Form>
        <div className="flex justify-end py-8">
        <Link className="text-white/70 text-[12px]" href={ROUTES.CHAT}>
          Skip for now
        </Link>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
