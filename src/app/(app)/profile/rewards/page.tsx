"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import RewardsList, { RewardsSummary } from "@/components/Rewards/RewardsList";
import RewardsAside from "@/components/Rewards/RewardsAside";
import { useGetRewardsQuery } from "@/store/userApi";
import { trackEvent } from "@/lib/analytics/track";
import { EventName } from "@/lib/analytics/types";
import { CAMPAIGN_PATH } from "@/app/credit-card-offers/_data/festive";

/**
 * My rewards: the user's campaign cashback, grouped by what they can do with
 * it, with a side column of banks still open to claim. WhatsApp updates
 * deep-link here; the voucher code is only ever shown on this page.
 */
export default function RewardsPage() {
  const { data, isLoading, isError } = useGetRewardsQuery();
  const tracked = useRef(false);

  useEffect(() => {
    if (!data || tracked.current) return;
    tracked.current = true;
    trackEvent(EventName.CASHBACK_PAGE_VIEWED, { claimCount: data.claims.length });
  }, [data]);

  const claims = data?.claims ?? [];

  return (
    <div className="min-h-screen w-full min-w-0 bg-brown-background px-20 pb-20 pt-20 font-satoshi max-lg:px-8 max-md:px-4 max-md:pb-28">
      <div className="w-full max-w-[1120px]">
        <header className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold tracking-tight text-white max-md:text-3xl">My rewards</h1>
          {claims.length ? (
            <RewardsSummary claims={claims} />
          ) : (
            <p className="text-[15px] text-white/60">Vouchers for cards you apply for through FiSense.</p>
          )}
        </header>

        <div className="mt-10 grid w-full gap-10 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0">
            {isLoading && (
              <div className="flex flex-col gap-3">
                {[0, 1].map((i) => (
                  <div key={i} className="h-[124px] animate-pulse rounded-2xl bg-white/[0.04]" />
                ))}
              </div>
            )}

            {isError && (
              <p className="text-sm text-white/60">Your rewards didn&apos;t load. Refresh the page to try again.</p>
            )}

            {data && !claims.length && (
              <div className="rounded-2xl border border-dashed border-white/15 p-6">
                <p className="text-[15px] font-semibold text-white">No rewards yet</p>
                <p className="mt-1.5 max-w-md text-sm leading-relaxed text-white/60">
                  Apply for one of our festive cards and get a voucher of up to ₹999 once the bank approves
                  it.
                </p>
                <Link
                  href={CAMPAIGN_PATH}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary-orange px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
                >
                  See festive card offers <ArrowRight className="size-4" />
                </Link>
              </div>
            )}

            {!!claims.length && <RewardsList claims={claims} />}
          </div>

          {data && (
            <div className="xl:sticky xl:top-10 xl:self-start">
              <RewardsAside claims={claims} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
