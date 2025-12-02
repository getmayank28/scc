"use client";
import { Header } from "@/components/Header";
import CardForYou from "@/landing/CardForYou";
import FAQSection from "@/landing/FAQs";
import { Footer } from "@/landing/Footer";
import GetCard from "@/landing/GetCard";
import Hero from "@/landing/Hero";
import { HowItWorks } from "@/landing/HowItWorks";
import { WhyFiSense } from "@/landing/WhyFiSense";
import { CreditIntelligence } from "@/components/CreditIntelligence";
import Tagline from "@/components/LandingAnimation/Tagline/Tagline";
import { divider } from "../../public/images/divider";





export default function Home() {
  return (
    <div className="bg-[#101010] w-full">
      <Header />
      <Hero />
      <div className="mx-auto flex justify-center">{divider}</div>
      <GetCard />
      <div className="mx-auto flex justify-center">{divider}</div>
      <HowItWorks />
      <div className="mx-auto flex justify-center">{divider}</div>
      <CreditIntelligence />
      <div className="mx-auto flex justify-center">{divider}</div>
      <WhyFiSense />
      <div className="mx-auto flex justify-center">{divider}</div>
      <CardForYou />
      <div className="mx-auto flex justify-center">{divider}</div>
      <FAQSection />
      <div className="mx-auto flex justify-center">{divider}</div>
      <Tagline />
      <div className="mx-auto flex justify-center">{divider}</div>
      <Footer />
    </div>
  );
}
