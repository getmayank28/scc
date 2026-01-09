import { signIn } from "next-auth/react";
import { Button } from "../ui/button";
import { divider } from "../../../public/images/divider";
import Typography from "../Typography/Typography";
import GoogleLogo from "../../../public/images/google-logo.png"
import Image from "next/image";
import { Spinner } from "../ui/spinner";
import { useState } from "react";

const SignInWithGoogle = () => {
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn =  () => {
    setIsLoading(true)
    signIn("google")
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
