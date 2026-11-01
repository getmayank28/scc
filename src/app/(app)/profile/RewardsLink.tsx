"use client";

import Link from "next/link";
import { ChevronRight, Gift } from "lucide-react";
import { ROUTES } from "@/lib/constants/routes";
import { useGetRewardsQuery } from "@/store/userApi";

/** Entry to My rewards on the profile, shown once the user has a claim. */
export default function RewardsLink() {
  const { data } = useGetRewardsQuery();
  if (!data?.claims.length) return null;

  const ready = data.hasUnrevealed;
  return (
    <Link
      href={ROUTES.REWARDS}
      className="mt-4 flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-4 hover:bg-white/[0.05]"
    >
      <span className="relative flex size-8 items-center justify-center rounded-lg bg-white/5 text-primary-orange">
        <Gift className="size-4" />
        {ready && <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-red-500" />}
      </span>
      <div className="mr-auto">
        <p className="text-base font-medium text-white">My rewards</p>
        <p className="text-xs text-white/60">
          {ready ? "Your voucher is ready to view" : "Track your festive card cashback"}
        </p>
      </div>
      <ChevronRight className="size-4 text-white/50" />
    </Link>
  );
}
