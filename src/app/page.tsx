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

export const divider = (
  <svg
    width="964"
    height="1"
    viewBox="0 0 964 1"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <line
      opacity="0.2"
      y1="0.5"
      x2="964"
      y2="0.5"
      stroke="url(#paint0_linear_5617_15403)"
    />
    <defs>
      <linearGradient
        id="paint0_linear_5617_15403"
        x1="0"
        y1="1.5"
        x2="964"
        y2="1.5"
        gradientUnits="userSpaceOnUse"
      >
        <stop stop-color="white" stop-opacity="0" />
        <stop offset="0.490385" stop-color="white" />
        <stop offset="1" stop-color="white" stop-opacity="0" />
      </linearGradient>
    </defs>
  </svg>
);



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
