import { emailVerificationSchema } from "@/schemas/signUpSchema";
import Typography from "../Typography/Typography";
import z from "zod";
import { signInSchema } from "@/schemas/signInSchema";
import { UseFormReturn } from "react-hook-form";
import { useSendVerificationCodeMutation } from "@/store/api";
import toast from "react-hot-toast";
import { Spinner } from "../ui/spinner";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";
import { encodeBase64 } from "@/lib/utils/encodeDecode";
import { trackEvent } from "@/lib/analytics/track";
import { EventName } from "@/lib/analytics/types";


const EmailQuerySchema = z.object({
    email: emailVerificationSchema,
  });


  interface ForgetPasswordProps{
    form:UseFormReturn<z.infer<typeof signInSchema>>
  }

  
const ForgetPassword = ({form}:ForgetPasswordProps) => {
  const router = useRouter()

  const [sendVerificationCode, { isLoading }] =
  useSendVerificationCodeMutation();

  const handleResend = async (email:string| undefined) => {

    if(!email){
      toast.error("Please enter a valid email");
      trackEvent(EventName.FORGET_PASSWORD_EMAIL_FAILED, {
        reason: "invalid_email",
      });
      return
    }

    try {
      const response = await sendVerificationCode({ email });

      if (response?.data?.success) {
        const encodeEmail = encodeBase64(email)
        toast.success(response?.data?.message);
        trackEvent(EventName.FORGET_PASSWORD_EMAIL_SENT, {});
        router.replace(`${ROUTES.CHANGE_PASSWORD}?e=${encodeEmail}`)
      } else {
        toast.error("Failed to send verification email");
        trackEvent(EventName.FORGET_PASSWORD_EMAIL_FAILED, {
          reason: "send_returned_unsuccessful",
        });
      }
    } catch {
      toast.error("Failed to send verification email");
      trackEvent(EventName.FORGET_PASSWORD_EMAIL_FAILED, {
        reason: "network_error",
      });
    }
  };

    const handleForgetPassword = () => {
        trackEvent(EventName.FORGET_PASSWORD_CLICKED, {});
        const queryParams = {
          email:form.getValues().identifier,
        };

        const result = EmailQuerySchema.safeParse(queryParams);
        if (!result.success) {
          const emailErrors = result.error.format().email?._errors || [];
          const error = emailErrors.join(" ") || "Please enter a valid email"

          form.setError("identifier", {
            message:error,
          });
        }else{
          form.clearErrors("identifier")
        }
        const values = result.data;
        handleResend(values?.email)
      };
  return (
    <div className="flex items-center gap-2 justify-end">
       {
      isLoading &&<Spinner color='#fff'/>
    }
      <Typography
      variant="caption"
      className={`text-right text-[12px] my-2 cursor-pointer text-white`}
      onClick={handleForgetPassword}
    >
      Forget Password 
    </Typography>
    
    </div>
    
  );
};

export default ForgetPassword;
