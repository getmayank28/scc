import CardLandingAnimation from "@/components/CardLandingAnimation/CardLandingAnimation";
import Checkmark from "@/components/CheckMark/CheckMark";
import Typography from "@/components/Typography/Typography";
import { Button } from "@/components/ui/button";
import useNav from "@/lib/hooks/useNav";
import HeaderText from "../HeaderText/HeaderText";
import Chip from "../ui/chip";
import { useSession } from "next-auth/react";

const steps = [
  {
    label: "Account created",
    completed: true,
  },
  {
    label: "Tell us about your spending",
    completed: false,
  },
  {
    label: "Get instant card matches",
    completed: false,
  },
  {
    label: "Apply for best card",
    completed: false,
  },
];
const WelcomeScreen = () => {
  const { goToCardCategory } = useNav();
  const session = useSession()

  const name = session?.data?.user?.name?.split(' ')?.at(0)
  const FirstName = name ? (name.slice(0,1)?.toUpperCase()+name.slice(1)?.toLowerCase()):undefined

  return (
    <div className="flex flex-col justify-center">
      <HeaderText
        title={`Welcome to Fisense, ${FirstName || ''}`}
        content="You're now part of 50,000+ users who've optimized their credit card rewards and  saved ₹2.4 Cr in fees this year. Let's find your perfect match!"
        contentClassName="max-w-2xl text-center"
      />
      <div className="px-4 py-12">
        <Typography
          variant="body"
          className="text-white uppercase tracking-[3px] mb-6 text-center"
        >
          Get your personalised card now
        </Typography>
        <div className="flex items-center justify-center gap-10">
          <div className="w-xl">
            <div className="flex flex-col gap-6 w-full">
              {steps?.map((step) => (
                <div
                  key={step.label}
                  className={`flex justify-between items-center gap-2 border rounded-md p-4 ${step.completed ? "border-primary-orange/70" : "border-white/40"}`}
                >
                  <div className="flex gap-2 items-center">
                    {step.completed ? (
                      <Checkmark className="w-[24px]" />
                    ) : (
                      <div className="w-6 h-6 rounded-full border border-white/40"></div>
                    )}
                    <Typography variant="body">{step.label}</Typography>
                  </div>
                  <Chip label= {step.completed ? "completed" : "pending"} variant= {step.completed ? "success" : "destructive"}/>
                </div>
              ))}
            </div>
          </div>
          <div>
            <CardLandingAnimation />
            <Typography
              variant="caption"
              className="text-white/70 font-bold mt-2"
            >
              Unclock:Personalised savings up to{" "}
              <span className="text-primary-orange">25,000/year</span>
            </Typography>
            <Button className="w-full h-[60px] mt-5" onClick={goToCardCategory}>
              Let&apos;s Go
              <p className="font-bold">→</p>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
