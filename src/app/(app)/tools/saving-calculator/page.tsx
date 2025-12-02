"use client";
import { Header } from "@/components/Header";
import { useState } from "react";
import Step1 from "./components/Step1/Step1";
import Step2 from "./components/Step2/Step2";
import { SpendProps } from "./types";
import Step3 from "./components/Step3/Step3";
import Typography from "@/components/Typography/Typography";
import Tagline from "@/components/LandingAnimation/Tagline/Tagline";
import { Footer } from "@/landing/Footer";
import { divider } from "@/app/page";
import { ActionButton } from "@/components/ui/action-button";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";

const SavingCalculator = () => {
  const [spends, setSpends] = useState<SpendProps>({
    onlineBillPayment: 40000,
    onlineShopping: 40000,
    offlineSpend: 40000,
  });

  const router = useRouter()

  return (
    <div>
      <div className="relative bg-background-primary min-h-screen text-white px-12 flex flex-col gap-14 py-24 pt-36">
      <Header />
      <div className="flex justify-between items-center">
       <div>
       <Typography variant="h3" className="text-left">
          Find the Smarter Way to Save
        </Typography>
        <Typography variant="body" className="text-left">
          Discover whether using a credit card boosts your savings or holds you
          back.
        </Typography>
       </div>
        <ActionButton title="Get your personalised card" onClick={() => router.push(ROUTES.SIGN_UP)}/>

      </div>
      <Step1 spends={spends} setSpends={setSpends} />
        <div className="mx-auto flex justify-center my-10">{divider}</div>
      <Step2 spends={spends} />
      <div className="mx-auto flex justify-center my-10">{divider}</div>
      <Step3 />
    </div>
    <Tagline />
    <Footer />
    </div>
    
  );
};

export default SavingCalculator;
