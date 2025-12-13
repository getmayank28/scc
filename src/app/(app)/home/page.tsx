"use client";
import BestMarketCard from "@/components/BestMarketCard/BestMarketCard";
import Divider from "@/components/Divider/Divider";
import WelcomeScreen from "@/components/WelcomeScreen/WelcomeScreen";

const Home = () => {
  return (
    <div className="w-full grow bg-background-primary text-white min-h-screen pt-30 pb-10 flex flex-col justify-center items-center">
      <WelcomeScreen/>
      <Divider className="mt-12 mb-10"/>
      <BestMarketCard/>
    </div>
  );
};

export default Home;
