"use client";
import { CreditCard } from "@/components/CreditCard";
import Typography from "@/components/Typography/Typography";
import { Button } from "@/components/ui/button";
// import BestMarketCard from "@/components/BestMarketCard/BestMarketCard";
// import Divider from "@/components/Divider/Divider";
import WelcomeScreen from "@/components/WelcomeScreen/WelcomeScreen";
import { ZIJUS_BOT_ID, ZIJUS_SESSION_API_URL } from "@/lib/constants/zijus";
import useUserData from "@/lib/hooks/useUserData";
import { IndianRupee } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import TopPerformingCard from "./components/TopPerformingCard";
import TopPerformingCardSection from "./components/TopPerformingCardSection";
import RecendSpendTransactionSection from "./components/RecendSpendTransactionSection";
import StatsSection from "./components/StatsSection";
import LastRecommendation from "./components/LastRecommendation";

const Home = () => {
  const { userId } = useUserData();

  // useEffect(() => {
  //   const handleAPI = async () => {

  //     const token = process.env.NEXT_PUBLIC_ZIJUS_API_TOKEN
  //     const payload = {
  //       bot_id: ZIJUS_BOT_ID,
  //       user_id:userId,
  //     };

  //    await fetch(
  //       `${ZIJUS_SESSION_API_URL}get-sessions-by-user`,
  //       {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //           Authorization: `Bearer ${token}`,
  //         },
  //         body: JSON.stringify(payload),
  //       }
  //     );
  //   };

  //   if(userId){
  //     handleAPI()
  //   }
  // },[userId]);

  return (
    <div className="w-full grow bg-brown-background text-white min-h-screen pt-30 pb-10 flex flex-col justify-start gap-8 items-center">
      <WelcomeScreen />

      {/* <div className="flex gap-8 justify-center mx-auto">
        <TopPerformingCardSection />
        <RecendSpendTransactionSection />
        <StatsSection />
      </div>
      <LastRecommendation /> */}

      {/* <Divider className="mt-28 mb-10 max-md:w-[300px] max-md:mt-16"/> */}
      {/* <BestMarketCard/> */}
    </div>
  );
};

export default Home;
