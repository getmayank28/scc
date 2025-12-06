import SignInSection from "@/components/SignInSection/SignInSection";


const SignIn = () => {

  return (
    <div className="h-screen relative overflow-hidden bg-background-primary flex items-center justify-center">
      <div className="absolute rotate-[60deg] -top-[50%] -left-[8%] w-200 h-200 rounded-[120px] bg-secondary-orange/30"></div>
      <div className="absolute rotate-[60deg] -bottom-[50%] -right-[8%] w-200 h-200 rounded-[120px] bg-secondary-orange/30"></div>
      <SignInSection/>
    </div>
  );
};

export default SignIn;
