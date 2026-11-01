"use client";

import Link from "next/link";
import { ChevronRight, MessageCircle } from "lucide-react";
import {
  CAMPAIGN_PATH,
  CARDS,
  WHATSAPP_URL,
} from "@/app/credit-card-offers/_data/festive";
import type { RewardClaim } from "@/types/rewards";
import { CardArt } from "./RewardsList";

/**
 * The right column of My rewards: festive cards from banks the user can still
 * claim (one voucher per bank), how the voucher gets here, and where to ask.
 */

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default function RewardsAside({ claims }: { claims: RewardClaim[] }) {
  // A bank is taken once any claim for it is still alive or paid out.
  const takenBanks = new Set(
    claims
      .filter((c) => c.status === "applied" || c.status === "approved" || c.status === "issued")
      .map((c) => c.bank),
  );
  const open = CARDS.filter((c) => !takenBanks.has(c.bank));

  return (
    <aside className="flex flex-col gap-4">
      {open.length > 0 && (
        <Panel title="More vouchers to claim">
          <ul className="-mx-2 flex flex-col">
            {open.map((card) => (
              <li key={card.slug}>
                <Link
                  href={`${CAMPAIGN_PATH}#${card.anchor}`}
                  className="group flex items-center gap-3 rounded-xl px-2 py-2 outline-none transition hover:bg-white/[0.04] focus-visible:ring-2 focus-visible:ring-primary-orange"
                >
                  <CardArt slug={card.slug} className="h-10 w-[25px] rounded-[4px]" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-white/85">{card.name}</span>
                    <span className="block text-xs font-semibold text-primary-orange">
                      {inr(card.voucher)} voucher
                    </span>
                  </span>
                  <ChevronRight className="size-4 text-white/30 transition group-hover:translate-x-0.5 group-hover:text-white/70" />
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] leading-relaxed text-white/40">
            One voucher per bank. Banks you already applied to are hidden.
          </p>
        </Panel>
      )}

      <Panel title="How you get your voucher">
        <ol className="flex flex-col gap-3 text-[13px] leading-snug text-white/70">
          {[
            "Apply from our festive offers page and finish the bank's form in one go.",
            "The bank decides. We update you here and on WhatsApp.",
            "Your voucher appears here within 48 hours of approval.",
          ].map((text, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-[11px] font-semibold text-white/70">
                {i + 1}
              </span>
              {text}
            </li>
          ))}
        </ol>
      </Panel>

      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 text-sm text-white/75 outline-none transition hover:bg-white/[0.05] focus-visible:ring-2 focus-visible:ring-primary-orange"
      >
        <MessageCircle className="size-[18px] text-secondary-success" />
        <span className="flex-1">
          Questions about a voucher?
          <span className="block text-xs text-white/45">Message us on WhatsApp</span>
        </span>
        <ChevronRight className="size-4 text-white/30" />
      </a>
    </aside>
  );
}
