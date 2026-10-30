/**
 * Copy for the festive card campaign (/credit-card-offers/festive). The wording
 * is agreed with the business and mirrors bank terms, so it lives here verbatim
 * rather than being derived from the card database. The only join to the DB is
 * `slug`, which `/api/out` resolves to the tracked bank application link.
 */

export interface Benefit {
  value: string;
  qualifier?: string;
}

export interface CampaignCard {
  /** Live `cards.slug`; Apply now resolves through `/api/out?type=card&id=<slug>`. */
  slug: string;
  /** Page anchor, also used in the WhatsApp drop-off link. */
  anchor: string;
  name: string;
  bank: string;
  network: string;
  bestFor: string;
  /** Short availability tag shown beside the card name. */
  tag?: string;
  hero: Benefit;
  benefits: [Benefit, Benefit, Benefit];
  joiningFee: number;
  annualFee: number;
  annualWaiver: string;
  /** FiSense voucher value, in rupees: the joining fee, or a flat amount on lifetime-free cards. */
  voucher: number;
  details: string[];
  /**
   * Official card art in /public. Landscape art is turned upright for display.
   * Without it, a card face is drawn in the card's colours.
   */
  image?: { src: string; width: number; height: number };
  face: { from: string; to: string; accent: string; ink: "light" | "dark" };
}

export interface FaqItem {
  q: string;
  a: string;
}

export const CAMPAIGN_KEY = "festive";
export const CAMPAIGN_PATH = "/credit-card-offers/festive";

export const WHATSAPP_NUMBER = "+91 75676 01600";
export const WHATSAPP_URL = "https://wa.me/917567601600?text=Hi";

export const HEADLINE = "Get up to ₹999 cashback on 5 top credit cards";
export const EYEBROW = "Limited-period festive offer";
/** The brief's trust line as three points under the hero; `short` is the phone label. */
export const TRUST_POINTS = [
  {
    icon: "no-calls",
    short: "No calls, ever",
    text: "FiSense will never call you.",
  },
  {
    icon: "bank",
    short: "Direct to bank",
    text: "Your application goes directly to the bank.",
  },
  {
    icon: "whatsapp",
    short: "WhatsApp updates",
    text: "Get every update on WhatsApp, right up to your voucher.",
  },
] as const;
export type TrustPoint = (typeof TRUST_POINTS)[number];
export const FOOTER_LINE =
  "Fees and benefits are set by the bank and can change. Check the bank's page before you apply.";

export const BEFORE_YOU_APPLY = [
  {
    lead: "One card per bank.",
    text: "If you already hold an SBI credit card, do not apply for another SBI card. Your application may be rejected, and the cashback offer will be withdrawn. Choose another card that suits your spending.",
  },
  {
    lead: "Finish in one go.",
    text: "Complete the bank's form in one sitting after you tap Apply now. If you drop off, apply again from this page or from the link we send you on WhatsApp.",
  },
  {
    lead: "Keep these ready.",
    text: "PAN, Aadhaar-linked mobile number and income proof.",
    /** Shown as a checklist; `text` stays as the accessible/SEO wording. */
    // Short chips first so they share a row on phones.
    items: ["PAN", "Income proof", "Aadhaar-linked mobile number"],
  },
] as const;

/** The step text is the agreed copy; titles are short labels for the step cards. */
export const CASHBACK_STEPS = [
  { title: "Apply in one go", text: "Complete your application in one go." },
  { title: "Get your card", text: "Get your card from the bank." },
  {
    title: "Use FiSense once",
    text: "Log in to FiSense, route one transaction through FiSense and request your cashback.",
  },
  {
    title: "Get your voucher",
    text: "Your cashback voucher will be given to you within 48 hours of the bank confirming your card to us.",
  },
] as const;

export const CARDS: CampaignCard[] = [
  {
    slug: "cashback-sbi-card-sbi-card",
    anchor: "sbi-cashback",
    name: "Cashback SBI Card",
    bank: "SBI Card",
    network: "VISA",
    bestFor: "Best for online shopping",
    hero: {
      value: "5% cashback on online spends",
      qualifier: "Up to ₹2,000 cashback a month",
    },
    benefits: [
      { value: "1% on offline spends", qualifier: "Up to ₹2,000 a month" },
      {
        value: "Auto cashback to your statement",
        qualifier: "Within two working days of your statement",
      },
      {
        value: "1% fuel surcharge waived",
        qualifier: "On fuel spends of ₹500 to ₹3,000. Up to ₹100 a month",
      },
    ],
    joiningFee: 999,
    annualFee: 999,
    annualWaiver: "Waived when you spend ₹2 lakh a year",
    voucher: 999,
    details: [
      "Total cashback is capped at ₹4,000 a statement cycle.",
      "No cashback on utilities, insurance, fuel, rent, wallet loads, education, jewellery, railways, gaming, tolls, government payments and EMI.",
    ],
    image: {
      src: "/images/campaign/sbi-cashback-card.png",
      width: 300,
      height: 477,
    },
    face: { from: "#2E1065", to: "#5B2A9E", accent: "#8B5CF6", ink: "light" },
  },
  {
    slug: "indusind-tiger-credit-card-indusind-bank",
    anchor: "indusind-tiger",
    name: "IndusInd Tiger",
    bank: "IndusInd Bank",
    network: "VISA",
    bestFor: "Best for travel and lounges",
    hero: {
      value: "10 free airport lounge visits a year",
      qualifier: "8 domestic (2 a quarter) and 2 international",
    },
    benefits: [
      {
        value: "Up to 6X reward points",
        qualifier:
          "1 point per ₹100 up to ₹1 lakh a year, rising to 6 points above ₹5 lakh. Use as cash or Air India miles",
      },
      {
        value: "Free movie ticket and golf",
        qualifier:
          "One BookMyShow ticket up to ₹500 every six months. One golf round a quarter",
      },
      { value: "1.5% forex mark-up", qualifier: "On international spends" },
    ],
    joiningFee: 0,
    annualFee: 0,
    annualWaiver: "No spend needed",
    voucher: 200,
    details: [
      "Reward rate by yearly spend: 1 point per ₹100 up to ₹1 lakh, 2X from ₹1 lakh to ₹2.5 lakh, 4X from ₹2.5 lakh to ₹5 lakh and 6X above ₹5 lakh.",
      "Points redeem as cash at ₹0.40 each (up to 5,000 points a month) or transfer 1:1 to Air India Maharaja Club.",
      "No points on fuel. Utilities, insurance, rent, education and government payments earn the base rate only.",
    ],
    image: {
      src: "/images/campaign/IndusInd-Tiger-Credit-Card.webp",
      width: 330,
      height: 522,
    },
    face: { from: "#0A0A0A", to: "#3F3F46", accent: "#A1A1AA", ink: "light" },
  },
  {
    slug: "tata-neu-plus-hdfc-bank-credit-card-hdfc-bank",
    anchor: "tata-neu-plus-hdfc",
    name: "Tata Neu Plus HDFC",
    bank: "HDFC Bank",
    network: "RuPay",
    bestFor: "Best for Tata brands",
    hero: {
      value: "Up to 7% NeuCoins on the Tata Neu app",
      qualifier:
        "2% from the card, plus 5% with NeuPass on selected categories",
    },
    benefits: [
      {
        value: "1% on all other spends",
        qualifier: "Paid as NeuCoins. 1 NeuCoin = ₹1",
      },
      {
        value: "499 NeuCoins welcome",
        qualifier:
          "On your first transaction within 30 days of getting the card",
      },
      {
        value: "Up to 4 domestic lounge visits a year",
        qualifier: "One voucher a quarter, on ₹50,000 spend in that quarter",
      },
    ],
    joiningFee: 499,
    annualFee: 499,
    annualWaiver: "Waived when you spend ₹1 lakh a year",
    voucher: 499,
    details: [
      "The card's 2% applies on Tata Neu and partner Tata brands, including BigBasket, Croma, 1mg, Air India, Westside, Tata CLiQ, Titan and Tanishq.",
      "NeuCoins expire 12 months after they are credited.",
      "No NeuCoins on fuel, rent, wallet loads and government payments.",
    ],
    image: {
      src: "/images/campaign/hdfc-Tata-Neu-Plus.png",
      width: 1025,
      height: 1625,
    },
    face: { from: "#1E3A8A", to: "#6D28D9", accent: "#60A5FA", ink: "light" },
  },
  {
    slug: "kiwi-card-yes-bank",
    anchor: "kiwi-yes-bank",
    name: "Kiwi YES Bank Klick",
    bank: "YES Bank",
    network: "RuPay",
    bestFor: "Best for UPI payments",
    hero: {
      value: "1.5% cashback on UPI Scan & Pay",
      qualifier: "Pay any shop's QR code through the Kiwi app",
    },
    benefits: [
      {
        value: "0.5% on online payments",
        qualifier: "Made through the Kiwi app",
      },
      {
        value: "Cashback to your bank account",
        qualifier: "Earned in the Kiwi app, then moved to your bank",
      },
      {
        value: "Instant virtual card",
        qualifier: "Start paying on UPI once approved",
      },
    ],
    joiningFee: 0,
    annualFee: 0,
    annualWaiver: "No spend needed",
    voucher: 500,
    details: [
      "The cashback rates apply only to payments made through the Kiwi app. Other card spends earn 2 YES Bank reward points per ₹200.",
      "The optional Kiwi Neon plan (₹999 + GST a year) raises UPI cashback to 2% and adds milestone benefits; it is not needed for the base card.",
      "Existing YES Bank credit cardholders cannot apply.",
    ],
    image: {
      src: "/images/campaign/kiwi-yes-bank.png",
      width: 701,
      height: 1175,
    },
    face: { from: "#365314", to: "#65A30D", accent: "#A3E635", ink: "light" },
  },
  {
    slug: "hdfc-swiggy-ornge-credit-card-hdfc-bank",
    anchor: "swiggy-ornge-hdfc",
    name: "Swiggy ORNGE HDFC",
    bank: "HDFC Bank",
    network: "Mastercard",
    bestFor: "Best for Swiggy users",
    hero: {
      value: "5% cashback on Swiggy and online shopping",
      qualifier:
        "Amazon, Flipkart, Myntra, Nykaa and more. Up to ₹1,500 a month on each",
    },
    benefits: [
      {
        value: "12 months of Swiggy One, free",
        qualifier: "When you activate the card within 37 days",
      },
      { value: "1% on all other spends", qualifier: "Up to ₹1,000 a month" },
      {
        value: "Cashback adjusted against your bill",
        qualifier: "Automatic, nothing to redeem",
      },
    ],
    joiningFee: 500,
    annualFee: 500,
    annualWaiver: "Waived when you spend ₹1.5 lakh a year",
    voucher: 500,
    details: [
      "The 5% on Swiggy covers food delivery, Instamart and Dineout.",
      "No cashback on fuel, rent, jewellery, government payments, gaming, education, EMI and wallet loads.",
    ],
    image: {
      src: "/images/campaign/swiggy-hdfc-ornge.png",
      width: 1116,
      height: 704,
    },
    face: { from: "#7C2D12", to: "#EA580C", accent: "#FB923C", ink: "light" },
  },
];

export const FAQ: FaqItem[] = [
  {
    q: "Do I still pay the joining fee to the bank?",
    a: "Yes. The bank charges the joining fee on your card as usual. FiSense sends you a cashback voucher once you complete the steps above.",
  },
  {
    q: "When will I get my cashback voucher?",
    a: "Within 48 hours of the bank confirming your card to us. We message you on WhatsApp as soon as we have the update.",
  },
  {
    q: "What does “route one transaction through FiSense” mean?",
    a: "Before any purchase, open Spend Optimizer on FiSense. Select your favourite shopping app to see the offers and rewards on your card. Complete the shopping on your selected app and you're done. We will send your cashback voucher within 48 hours of the bank confirming your card to us.",
  },
  {
    q: "Can I apply for more than one card?",
    a: "Yes, you can apply for more than one card, but only one card from each bank. If you apply for two cards from the same bank, the bank will reject one of them.",
  },
  {
    q: "What if I could not finish my application?",
    a: "Apply again from this page, or use the link we send you on WhatsApp 24 hours after you start. If you apply any other way, we cannot track your application, and the cashback cannot be paid.",
  },
  {
    q: "What if the bank rejects my application?",
    a: "The bank alone decides on approval, and FiSense has no say in it. If your card is not approved, no joining fee is charged and no cashback is due. The bank may check your credit report when you apply.",
  },
  {
    q: "Does FiSense charge me anything?",
    a: "No. FiSense is free for our customers. We may charge a bank a referral fee based on the services we provide them.",
  },
  {
    q: "Who will contact me after I apply?",
    a: "FiSense will never call you, unless you ask us to in exceptional cases. We message you on WhatsApp about your application and give you your voucher. The bank may call or message you to verify your application.",
  },
];

export const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/** "₹999 + GST", or "Lifetime free" for a ₹0 fee. */
export const feeLabel = (n: number) =>
  n > 0 ? `${inr(n)} + GST` : "Lifetime free";

/** The voucher line under the fees: a refund of the fee, or a flat voucher on free cards. */
export const voucherLine = (
  card: Pick<CampaignCard, "joiningFee" | "voucher">,
) =>
  card.joiningFee > 0
    ? `Pay ${inr(card.joiningFee)} joining fee. Get a ${inr(card.voucher)} voucher back from FiSense`
    : `Get a ${inr(card.voucher)} festive voucher from FiSense`;
