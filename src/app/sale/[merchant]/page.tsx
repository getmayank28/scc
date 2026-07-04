import type { Metadata } from "next";
import { MERCHANTS, getMerchant } from "./data/merchants";
import { getMerchantCards, getMerchantOffers, maxSaving } from "./data/savings";
import { SaleLanding } from "./components/SaleLanding";

/** Representative basket used to tease a real "potential savings" figure. */
const TEASER_AMOUNT = 50000;

export function generateStaticParams() {
  return Object.keys(MERCHANTS).map((merchant) => ({ merchant }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ merchant: string }>;
}): Promise<Metadata> {
  const { merchant } = await params;
  const config = getMerchant(merchant);
  const title = `${config.saleName} is Live — Find your best card | FiSense`;
  const description = `Stop guessing which credit card to use this ${config.label} sale. We compare your cards against every live offer and reveal the one that saves you the most.`;

  return {
    title,
    description,
    openGraph: { title, description },
    robots: { index: true, follow: true },
  };
}

export default async function SaleMerchantPage({
  params,
}: {
  params: Promise<{ merchant: string }>;
}) {
  const { merchant } = await params;
  const config = getMerchant(merchant);

  // Trim the full dataset to this merchant on the server so the browser only
  // receives the offers it needs to power the interactive estimator.
  const offers = getMerchantOffers(config.key);
  const cards = getMerchantCards(config.key);
  const potentialSaving = maxSaving(offers, TEASER_AMOUNT);

  return (
    <SaleLanding
      merchant={config}
      offers={offers}
      cards={cards}
      liveOfferCount={offers.length}
      potentialSaving={potentialSaving}
    />
  );
}
