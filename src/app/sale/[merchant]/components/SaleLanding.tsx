"use client";

import { Header } from "@/components/Header";
import { Footer } from "@/landing/Footer";
import type { MerchantConfig } from "../data/merchants";
import type { CardOffer, MerchantOffer } from "../data/savings";
import { Hero } from "./Hero";
import { CoverageStats } from "./CoverageStats";
import { SavingsEstimator } from "./SavingsEstimator";
import { CardBreakdown } from "./CardBreakdown";
import { SampleOffers } from "./SampleOffers";
import { HowItWorks } from "./HowItWorks";
import { LockedRecommendation } from "./LockedRecommendation";
import { WhySignIn } from "./WhySignIn";

export interface SaleLandingProps {
  merchant: MerchantConfig;
  offers: MerchantOffer[];
  cards: CardOffer[];
  liveOfferCount: number;
  potentialSaving: number;
}

/**
 * Client root for the sale landing page. Composes every section in order; each
 * one manages its own scroll-triggered entrance so the page reveals
 * progressively as the visitor moves toward the sign-in CTA.
 */
export function SaleLanding({
  merchant,
  offers,
  cards,
  liveOfferCount,
  potentialSaving,
}: SaleLandingProps) {
  return (
    <main className="min-h-screen bg-background-primary text-white antialiased">
      <Header />
      <Hero merchant={merchant} />
      <div id="coverage" className="scroll-mt-4">
        <CoverageStats merchant={merchant} liveOfferCount={liveOfferCount} />
      </div>
      <div id="estimator" className="scroll-mt-4">
        <SavingsEstimator merchant={merchant} offers={offers} />
      </div>
      <div id="card-breakdown" className="scroll-mt-4">
        <CardBreakdown merchant={merchant} cards={cards} />
      </div>
      <div id="offers" className="scroll-mt-4">
        <SampleOffers merchant={merchant} />
      </div>
      <div id="how-it-works" className="scroll-mt-4">
        <HowItWorks />
      </div>
      <div id="recommendation" className="scroll-mt-4">
        <LockedRecommendation merchant={merchant} potentialSaving={potentialSaving} />
      </div>
      {/* <div id="why" className="scroll-mt-4">
        <WhySignIn />
      </div> */}
      <Footer />
    </main>
  );
}
