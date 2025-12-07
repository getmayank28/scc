"use client";
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
import { ROUTES } from "@/lib/constants/routes";
import { decodeBase64 } from "@/lib/utils/encodeDecode";
import { changePasswordSchema } from "@/schemas/changePasswordSchema";
import { useChangePasswordMutation } from "@/store/api";
import { APIFailure } from "@/types/ApiResponse";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import z from "zod";

const ChangePassword = () => {
    const router = useRouter()
    const params = useSearchParams()
    const emailParam = params.get('e');
    const email = decodeBase64(emailParam as string)

    const [showPassword, setShowPassword] = useState({password:false, confirmPassword:false})

    const [changePasswordMutation, {data, error, isLoading}] = useChangePasswordMutation()


    useEffect(() => {
        if (data && data?.success) {
          toast.success("Password successfully updated");
          router.replace(ROUTES.SIGN_IN);
        }
        if (error && (error as APIFailure)?.status) {
          const message =
            (error as APIFailure)?.data?.message || "Failed to update password";
          toast.error(message);
        }
      }, [(error as APIFailure)?.status, data?.success]);


  const form = useForm<z.infer<typeof changePasswordSchema>>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: z.infer<typeof changePasswordSchema>) => {
    changePasswordMutation({...data, email})
  };

  return (
    <div className="h-screen relative overflow-hidden bg-background-primary flex items-center justify-center">
      <div className="absolute rotate-[60deg] -top-[50%] -left-[8%] w-200 h-200 rounded-[120px] bg-secondary-orange/30"></div>
      <div className="absolute rotate-[60deg] -bottom-[50%] -right-[8%] w-200 h-200 rounded-[120px] bg-secondary-orange/30"></div>
      <div className="relative z-10 w-[545px] bg-background-primary p-12 px-14 rounded-2xl border border-white/20">
        <h1 className="text-[#FFF] text-center relative z-[100] font-butlerpro text-[40px] font-medium leading-[110%]">
          Change Password
        </h1>
        <p className="text-white opacity-70 relative z-[100] text-center font-satoshi text-[14px]  font-normal leading-[150%] tracking-[-2%] [font-feature-settings:'ss03_on']">
          Please enter a new password to update
        </p>
       
        <Form {...form}>
          <form className="mt-10" onSubmit={form.handleSubmit(onSubmit)}>
         <div className="flex flex-col gap-6">
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
         <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      className="h-12 text-white border-white/30"
                      type={showPassword?.password?"text":"password"}
                      placeholder="Password"
                      rightIcon={
                        showPassword?.password?
                        <EyeOff color="#fff" onClick={() => setShowPassword((prev) => ({...prev, password:!prev.password}))}/>:
                        <Eye color="#fff" onClick={() => setShowPassword((prev) => ({...prev, password:!prev.password}))}/>
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
               <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      className="h-12 text-white border-white/30"
                      type={showPassword?.confirmPassword?"text":"password"}
                      placeholder="Confirm Password"
                      rightIcon={
                        showPassword?.confirmPassword?
                        <EyeOff color="#fff" onClick={() => setShowPassword((prev) => ({...prev, confirmPassword:!prev.confirmPassword}))}/>:
                        <Eye color="#fff" onClick={() => setShowPassword((prev) => ({...prev, confirmPassword:!prev.confirmPassword}))}/>
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
         </div>
            <Button
              className="w-full mt-6 rounded-full h-12 cursor-pointer bg-primary-orange/70 hover:bg-primary-orange"
              type="submit"
            >
              {isLoading ? (
                <div className="flex gap-2 items-center">
                  <Spinner />
                  <span>Updating password...</span>
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

export default ChangePassword;
