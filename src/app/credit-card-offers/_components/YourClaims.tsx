"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { ChevronRight } from "lucide-react";
import RewardsList from "@/components/Rewards/RewardsList";
import { ROUTES } from "@/lib/constants/routes";
import { useGetRewardsQuery } from "@/store/userApi";

/**
 * "Your cashback" on the campaign page for signed-in visitors who already
 * applied: the same tracker as My rewards, so a returning user sees where
 * they stand before scrolling to the cards. Renders nothing otherwise.
 */
export function YourClaims({ campaign }: { campaign: string }) {
  const { status } = useSession();
  const { data } = useGetRewardsQuery(undefined, { skip: status !== "authenticated" });
  const claims = data?.claims.filter((c) => c.campaign === campaign) ?? [];
  if (!claims.length) return null;

  return (
    <section aria-labelledby="your-cashback-heading" className="px-5 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-end justify-between gap-3">
          <h2
            id="your-cashback-heading"
            className="font-satoshi text-2xl font-semibold tracking-tight text-white sm:text-3xl"
          >
            Your cashback
          </h2>
          <Link
            href={ROUTES.REWARDS}
            className="inline-flex shrink-0 items-center gap-0.5 text-sm font-semibold text-primary-orange hover:underline"
          >
            My rewards <ChevronRight className="size-4" />
          </Link>
        </div>
        <div className="mt-5">
          <RewardsList claims={claims} />
        </div>
      </div>
    </section>
  );
}
