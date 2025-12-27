"use client";

import { Header } from "@/components/Header";
import HeroSection from "./components/Hero";
import ChooseFromTheBest from "./components/ChooseFromBest";
import TheWrongCard from "./components/TheWrongCard";
import YourSpendings from "./components/YourSpending";
import CardDrainYou from "./components/CardDrainYou";
import { HowItWorks } from "./components/HowIsWorks";
import Typography from "@/components/Typography/Typography";
import FAQSection from "@/landing/FAQs";
import Tagline from "@/components/LandingAnimation/Tagline/Tagline";
import { Footer } from "@/landing/Footer";

const Landing = () => {
  return (
    <div>
      <Header />
      <HeroSection />
      <ChooseFromTheBest />
      <YourSpendings />
      <div className="bg-black py-5">
        <Typography variant="h4" className="text-white/70 uppercase tracking-[3px] text-center leading-24">
          Same Spend Differnt Card Different Rewards
        </Typography>
      </div>
      <CardDrainYou />
      <div className="bg-black py-5">
        <Typography variant="h4" className="text-white/70 uppercase tracking-[3px] text-center leading-24">
         Which one is the right card?
        </Typography>
      </div>
      <TheWrongCard />
      <div className="bg-black py-5">
        <Typography variant="h4" className="text-white/70 uppercase tracking-[3px] text-center leading-24">
        We’ve analysed 500+ cards, so you don’t have to
        </Typography>
      </div>
      <HowItWorks />
      <div className="bg-black py-5">
        <Typography variant="h4" className="text-white/70 uppercase tracking-[3px] text-center leading-24">
       Few steps from you, leave the rest to us.
        </Typography>
      </div>
      <FAQSection />
      <Tagline />
      <Footer />
    </div>
  );
};

export default Landing;
