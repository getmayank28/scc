"use client";

import dayjs from "dayjs";
import { CreditCard, Receipt, ShoppingBag } from "lucide-react";
import { useGetAffiliateActivityQuery } from "@/store/userApi";
import type { ActivityItem, ActivityState } from "@/types/affiliate";
import { cn } from "@/lib/utils/index";

/**
 * "Applications & purchases" on the profile: what the user started through
 * FiSense and whether the merchant or bank confirmed it. Status only — no
 * amounts (see /api/user/affiliate-activity).
 */

const STATE_LABEL: Record<ActivityItem["kind"], Record<ActivityState, string>> = {
  card_application: {
    tracked: "Tracked — awaiting confirmation",
    confirmed: "Application confirmed",
    not_confirmed: "Not confirmed",
  },
  purchase: {
    tracked: "Tracked — awaiting confirmation",
    confirmed: "Purchase confirmed",
    not_confirmed: "Not confirmed",
  },
};

const STATE_STYLE: Record<ActivityState, string> = {
  tracked: "bg-white/10 text-white/80",
  confirmed: "bg-primary-orange/15 text-primary-orange",
  not_confirmed: "bg-white/5 text-white/50",
};

export default function AffiliateActivity() {
  const { data: items, isLoading, isError } = useGetAffiliateActivityQuery();
  const hasApplications = items?.some((i) => i.kind === "card_application");

  return (
    <section className="flex flex-col rounded-2xl border border-white/5 bg-white/[0.03] p-4">
      <div className="flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-lg bg-white/5 text-primary-orange">
          <Receipt className="size-4" />
        </div>
        <div>
          <h2 className="text-base font-medium text-white">Applications &amp; purchases</h2>
          <p className="text-xs text-white/60">
            Card applications and shopping you started from Spend optimizer.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {isLoading &&
          [0, 1].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-white/[0.04]" />
          ))}

        {isError && (
          <p className="text-sm text-white/60">Couldn&apos;t load your activity. Please try again later.</p>
        )}

        {!isLoading && !isError && !items?.length && (
          <p className="rounded-xl bg-white/[0.04] px-4 py-3 text-sm text-white/70">
            Nothing yet. When you apply for a card or shop through spend optimizer, it&apos;ll show up here.
          </p>
        )}

        {items?.map((item) => {
          const Icon = item.kind === "card_application" ? CreditCard : ShoppingBag;
          return (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-xl bg-white/[0.04] p-3 max-md:flex-wrap"
            >
              <Icon className="size-4 shrink-0 text-white/70" />
              <div className="min-w-0 mr-auto">
                <p className="truncate text-sm font-medium text-white">{item.title}</p>
                <p className="text-xs text-white/50">
                  {item.kind === "card_application" ? "Card application" : "Purchase"}
                  {item.date && ` · ${dayjs(item.date).format("D MMM YYYY")}`}
                </p>
              </div>
              <span
                className={cn(
                  "rounded-md px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap",
                  STATE_STYLE[item.state],
                )}
              >
                {STATE_LABEL[item.kind][item.state]}
              </span>
            </div>
          );
        })}
      </div>

      {hasApplications && (
        <p className="mt-4 text-xs leading-relaxed text-white/50">
          &ldquo;Application confirmed&rdquo; means the bank received your application. It
          isn&apos;t a card approval — the bank tells you that directly.
        </p>
      )}
    </section>
  );
}
