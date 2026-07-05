import { signIn } from "next-auth/react";
import { Button } from "../ui/button";
import { divider } from "../../../public/images/divider";
import Typography from "../Typography/Typography";
import GoogleLogo from "../../../public/images/google-logo.png"
import Image from "next/image";
import { Spinner } from "../ui/spinner";
import { useState } from "react";
import { trackEvent } from "@/lib/analytics/track";
import { EventName } from "@/lib/analytics/types";

const SignInWithGoogle = () => {
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn =  () => {
    localStorage.clear()
    setIsLoading(true)
    trackEvent(EventName.SIGNIN_GOOGLE_CLICKED, {});
    trackEvent(EventName.SIGNIN_SUBMITTED, { method: "google" });
    // Carry a same-origin post-login destination through the OAuth round-trip
    // (the sale funnel passes ?callbackUrl=/sale/continue).
    const callbackUrl = new URLSearchParams(window.location.search).get(
      "callbackUrl"
    );
    signIn("google", callbackUrl?.startsWith("/") ? { callbackUrl } : undefined);
  }
  return (
    <div className="mt-6">
      <Button
        className="w-full border border-white/30 rounded-full h-12 cursor-pointer bg-background-primary hover:bg-secondary-orange"
        onClick={handleSignIn}
      >
        
       {isLoading&& <Spinner />} Sign in With <Image width={60} src={GoogleLogo} alt="google-logo"/>
      </Button>
      
      <div className="mt-8 -mb-8 relative">
        <div className="flex justify-center">{divider}</div>
        <Typography
          className="w-9 absolite top-1/2 left-1/2 transform -translate-1/2 bg-background-primary"
          variant="body"
        >
          OR
        </Typography>
      </div>
    </div>
  );
};

export default SignInWithGoogle;
