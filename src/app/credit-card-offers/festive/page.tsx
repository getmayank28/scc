import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/landing/Footer";
import {
  CAMPAIGN_KEY,
  CAMPAIGN_PATH,
  CARDS,
  EYEBROW,
  FAQ,
  FOOTER_LINE,
  HEADLINE,
  TRUST_POINTS,
  feeLabel,
  voucherLine,
} from "../_data/festive";
import { CardCarousel } from "../_components/CardCarousel";
import {
  BeforeYouApply,
  CampaignFaq,
  CashbackSteps,
} from "../_components/Sections";
import { CampaignViewTracker } from "../_components/Tracked";
import { CampaignHero } from "../_components/Hero";

const SITE_URL = "https://www.gofisense.com";
const PAGE_URL = `${SITE_URL}${CAMPAIGN_PATH}`;

const title = "Festive Credit Card Offers: Get Up to ₹999 Cashback | FiSense";
const description =
  "Apply for Cashback SBI, IndusInd Tiger, Tata Neu Plus HDFC, Kiwi YES Bank or Swiggy ORNGE HDFC through FiSense and get a festive voucher of up to ₹999. Limited-period festive offer.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: CAMPAIGN_PATH },
  metadataBase: new URL(SITE_URL),
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: PAGE_URL,
    siteName: "FiSense",
    title: HEADLINE,
    description,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: HEADLINE,
    description,
  },
};

function jsonLd() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Festive credit card offers",
      itemListElement: CARDS.map((card, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${PAGE_URL}#${card.anchor}`,
        item: {
          "@type": "CreditCard",
          name: card.name,
          description: `${card.bestFor}. ${card.hero.value}.`,
          provider: { "@type": "BankOrCreditUnion", name: card.bank },
          feesAndCommissionsSpecification: `Joining fee: ${feeLabel(card.joiningFee)}. Annual fee: ${feeLabel(card.annualFee)}, ${card.annualWaiver.toLowerCase()}.`,
          offers: {
            "@type": "Offer",
            description: `${voucherLine(card)}.`,
            price: card.joiningFee,
            priceCurrency: "INR",
            seller: { "@type": "Organization", name: "FiSense" },
          },
        },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "FiSense", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Festive credit card offers", item: PAGE_URL },
      ],
    },
  ];
}

export default function FestiveCampaignPage() {
  return (
    <main className="min-h-screen bg-background-primary font-satoshi text-white antialiased">
      <script
        type="application/ld+json"
        // Static copy from our own config; "<" is escaped so it can't close the tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd()).replace(/</g, "\\u003c") }}
      />
      <CampaignViewTracker campaign={CAMPAIGN_KEY} />
      <Header />

      <CampaignHero headline={HEADLINE} eyebrow={EYEBROW} trustPoints={TRUST_POINTS} cards={CARDS} />

      {/* One rhythm for every section gap after the hero. */}
      {/* mt is 8px short of the gap: the hero keeps 8px under its trust bar for the shadow. */}
      <div className="mt-[88px] space-y-24 pb-20 sm:mt-[120px] sm:space-y-32 sm:pb-24">
        <BeforeYouApply />

        <section id="cards" aria-labelledby="cards-heading" className="scroll-mt-24 px-5 sm:px-8">
          <div className="mx-auto max-w-6xl">
            <h2
              id="cards-heading"
              className="font-satoshi text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-center"
            >
              Pick your card
            </h2>
            <div className="mt-6">
              <CardCarousel cards={CARDS} campaign={CAMPAIGN_KEY} />
            </div>
          </div>
        </section>

        <CashbackSteps campaign={CAMPAIGN_KEY} />

        {/* the bank-terms line belongs with the FAQs, not a full section gap away */}
        <div>
          <CampaignFaq items={FAQ} campaign={CAMPAIGN_KEY} />
          <p className="mx-auto mt-10 max-w-3xl px-5 text-center text-xs leading-relaxed text-white/45 sm:px-8">
            {FOOTER_LINE}
          </p>
        </div>
      </div>

      <Footer />
    </main>
  );
}
