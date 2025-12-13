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
import Divider from "@/components/Divider/Divider";

export default function Home() {
  return (
    <div className="bg-[#101010] w-full">
      <Header />
      <Hero />
      <Divider />
      <GetCard />
      <Divider />
      <HowItWorks />
      <Divider />
      <CreditIntelligence />
      <Divider />
      <WhyFiSense />
      <Divider />
      <CardForYou />
      <Divider />
      <FAQSection />
      <Divider />
      <Tagline />
      <Divider />
      <Footer />
    </div>
  );
}
