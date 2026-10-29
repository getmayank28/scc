import {
  Building2,
  Check,
  ChevronRight,
  ClipboardCheck,
  CreditCard,
  FileCheck2,
  Gift,
  MessageCircle,
  Smartphone,
  Timer,
} from "lucide-react";
import { Reveal } from "@/app/sale/[merchant]/animations/Reveal";
import {
  BEFORE_YOU_APPLY,
  CASHBACK_STEPS,
  WHATSAPP_NUMBER,
  WHATSAPP_URL,
  type FaqItem,
} from "../_data/festive";
import { TrackedDetails, WhatsAppLink } from "./Tracked";

const BEFORE_ICONS = [Building2, Timer, FileCheck2];
const BEFORE_TILES = [
  "from-rose-400 to-red-600",
  "from-sky-400 to-blue-600",
  "from-emerald-400 to-teal-600",
];

export function BeforeYouApply() {
  return (
    <section aria-labelledby="before-heading" className="px-5 sm:px-8">
      <Reveal className="mx-auto max-w-6xl">
        <div className="relative overflow-hidden rounded-3xl border border-amber-300/15 bg-[linear-gradient(135deg,rgba(251,191,36,0.07)_0%,rgba(255,255,255,0.025)_45%)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:p-8">
          <h2
            id="before-heading"
            className="font-satoshi text-lg font-semibold text-white sm:text-xl md:text-center"
          >
            Before you apply
          </h2>

          <ul className="mt-4 grid divide-y divide-white/10 sm:mt-6 md:grid-cols-3 md:divide-x md:divide-y-0">
            {BEFORE_YOU_APPLY.map((item, i) => {
              const Icon = BEFORE_ICONS[i];
              const checklist = "items" in item ? item.items : null;
              return (
                <li
                  key={item.lead}
                  className="flex gap-3 py-4 first:pt-0 last:pb-0 sm:gap-4 md:flex-col md:px-7 md:py-0 md:first:pl-0 md:last:pr-0"
                >
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br sm:size-11 sm:rounded-2xl ${BEFORE_TILES[i]} shadow-[inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-6px_12px_rgba(0,0,0,0.2),0_10px_24px_-12px_rgba(0,0,0,0.8)]`}
                  >
                    <Icon className="size-[18px] text-white sm:size-5" strokeWidth={2.2} aria-hidden />
                  </span>
                  <div className="min-w-0 pt-1.5 sm:pt-0">
                    <h3 className="font-satoshi text-[15px] font-semibold leading-tight text-white sm:text-base">
                      {item.lead.replace(/\.$/, "")}
                    </h3>
                    {checklist ? (
                      <>
                        <p className="sr-only">{item.text}</p>
                        <ul aria-hidden className="mt-2 flex flex-wrap gap-1.5 sm:mt-2.5 sm:gap-2">
                          {checklist.map((doc) => (
                            <li
                              key={doc}
                              className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs text-white/80 sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-[13px]"
                            >
                              <Check className="size-3 text-emerald-400 sm:size-3.5" strokeWidth={2.6} />
                              {doc}
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : (
                      <p className="mt-1 text-[13px] leading-normal text-white/60 sm:mt-1.5 sm:text-sm sm:leading-relaxed">
                        {item.text}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </Reveal>
    </section>
  );
}

const STEP_ICONS = [ClipboardCheck, CreditCard, Smartphone, Gift];
const STEP_TILES = [
  "from-sky-400 to-blue-600",
  "from-violet-400 to-purple-600",
  "from-fuchsia-400 to-pink-600",
  "from-amber-300 to-orange-600",
];

export function CashbackSteps({ campaign }: { campaign: string }) {
  const last = CASHBACK_STEPS.length - 1;
  return (
    <section
      id="how-it-works"
      aria-labelledby="steps-heading"
      className="scroll-mt-24 px-5 sm:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal className="max-w-2xl md:mx-auto md:text-center">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-primary-orange/30 bg-primary-orange/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-primary-orange">
            {CASHBACK_STEPS.length} simple steps
          </p>
          <h2
            id="steps-heading"
            className="mt-4 font-satoshi text-3xl font-semibold tracking-tight text-white sm:text-4xl"
          >
            How to get your cashback
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">
            Your voucher is given to you within 48 hours of the bank confirming your card to us.
          </p>
        </Reveal>

        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CASHBACK_STEPS.map((step, i) => {
            const Icon = STEP_ICONS[i];
            const payoff = i === last;
            return (
              <li key={step.title} className="relative">
                <Reveal delay={i * 0.08} className="h-full">
                  <div
                    className={`relative h-full overflow-hidden rounded-3xl border p-6 transition duration-300 hover:-translate-y-1 ${
                      payoff
                        ? "border-primary-orange/40 bg-[linear-gradient(160deg,color-mix(in_oklch,var(--primary-orange)_16%,transparent),rgba(255,255,255,0.02)_70%)] shadow-[0_20px_50px_-25px_var(--primary-orange)]"
                        : "border-white/10 bg-white/[0.035] hover:border-white/20"
                    }`}
                  >
                    {/* big faint step number */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -right-1 -top-3 font-satoshi text-[5.5rem] font-bold leading-none text-white/[0.05]"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={`relative flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br ${STEP_TILES[i]} shadow-[inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-6px_12px_rgba(0,0,0,0.2),0_10px_24px_-10px_rgba(0,0,0,0.8)]`}
                    >
                      <Icon className="size-[22px] text-white" strokeWidth={2.2} aria-hidden />
                    </span>
                    <p
                      className={`relative mt-5 text-[11px] font-semibold uppercase tracking-[0.14em] ${payoff ? "text-primary-orange" : "text-white/45"}`}
                    >
                      Step {i + 1}
                    </p>
                    <h3 className="relative mt-1 font-satoshi text-lg font-semibold text-white">
                      {step.title}
                    </h3>
                    <p className="relative mt-2 text-sm leading-relaxed text-white/60">{step.text}</p>
                  </div>
                </Reveal>
                {/* arrow chip bridging to the next step (desktop row only) */}
                {i < last && (
                  <span
                    aria-hidden
                    className="absolute -right-6 top-[42px] z-10 hidden size-8 items-center justify-center rounded-full bg-background-primary text-white/50 ring-1 ring-white/10 lg:flex"
                  >
                    <ChevronRight className="size-4" />
                  </span>
                )}
              </li>
            );
          })}
        </ol>

        <Reveal className="mt-6">
          <div className="flex flex-col items-start gap-4 rounded-3xl border border-[#25D366]/25 bg-[linear-gradient(100deg,rgba(37,211,102,0.12),rgba(255,255,255,0.02)_60%)] p-5 sm:flex-row sm:items-center sm:gap-5 sm:p-6">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#25D366] shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_10px_24px_-10px_#25D366]">
              <MessageCircle className="size-6 text-white" strokeWidth={2.2} aria-hidden />
            </span>
            <div className="flex-1">
              <p className="font-satoshi text-base font-semibold text-white">Stuck at any step?</p>
              <p className="mt-0.5 text-sm leading-relaxed text-white/65">
                Say &ldquo;Hi&rdquo; on WhatsApp at {WHATSAPP_NUMBER}, and a FiSense agent will help
                you.
              </p>
            </div>
            <WhatsAppLink
              href={WHATSAPP_URL}
              campaign={campaign}
              source="steps"
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-[#25D366] px-5 text-sm font-bold text-[#052E16] shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_10px_24px_-12px_#25D366] transition hover:-translate-y-0.5 hover:brightness-110"
            >
              <MessageCircle className="size-4" strokeWidth={2.4} aria-hidden />
              Say Hi on WhatsApp
            </WhatsAppLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function CampaignFaq({ items, campaign }: { items: FaqItem[]; campaign: string }) {
  return (
    <section id="faq" aria-labelledby="faq-heading" className="scroll-mt-24 px-5 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <h2
          id="faq-heading"
          className="font-satoshi text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-center"
        >
          FAQs
        </h2>
        <div className="mt-6 divide-y divide-white/10 border-y border-white/10">
          {items.map((item) => (
            <TrackedDetails
              key={item.q}
              name="campaign-faq"
              event={{ campaign, question: item.q }}
              className="group"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-left font-satoshi text-base font-medium text-white sm:text-[17px] [&::-webkit-details-marker]:hidden">
                {item.q}
                <span
                  aria-hidden
                  className="relative size-5 shrink-0 text-white/60 before:absolute before:left-0 before:top-1/2 before:h-[1.5px] before:w-5 before:-translate-y-1/2 before:bg-current after:absolute after:left-1/2 after:top-0 after:h-5 after:w-[1.5px] after:-translate-x-1/2 after:bg-current after:transition group-open:after:scale-y-0"
                />
              </summary>
              <p className="pb-5 pr-8 text-[15px] leading-relaxed text-white/65">{item.a}</p>
            </TrackedDetails>
          ))}
        </div>
      </div>
    </section>
  );
}
