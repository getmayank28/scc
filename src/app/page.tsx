"use client";
import Landing from "@/components/Landing";
import { trackEvent } from "@/lib/analytics/track";
import { EventName } from "@/lib/analytics/types";
import { useEffect } from "react";

export default function Home() {

  
  useEffect(() => {
    trackEvent(EventName.LANDING_PAGE, {
      path: window.location.pathname,
      referrer: document.referrer,
    });
  }, []);


  return (
    <div className="bg-[#101010] w-full">
      <Landing/>
      {/* <Header />
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
      <Footer /> */}
    </div>
  );
}
