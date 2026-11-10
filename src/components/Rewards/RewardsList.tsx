"use client";

import { useState } from "react";
import Image from "next/image";
import dayjs from "dayjs";
import { Check, Copy, Eye, Loader2, Undo2 } from "lucide-react";
import toast from "react-hot-toast";
import { useRevealVoucherMutation, useSetVoucherUsedMutation } from "@/store/userApi";
import { trackEvent } from "@/lib/analytics/track";
import { EventName } from "@/lib/analytics/types";
import { cn } from "@/lib/utils/index";
import { CARDS } from "@/app/credit-card-offers/_data/festive";
import type { RevealedVoucher, RewardClaim } from "@/types/rewards";

/**
 * The user's campaign claims, grouped by what they can do with them:
 *   Ready to use      — issued, not used, not expired: a gift card with a
 *                       masked code strip that reveals in place;
 *   On its way        — applied / approved, with a 3-step track;
 *   Used or expired   — marked used by the user (we can't see redemption at
 *                       the brand) or past its use-by date;
 *   Closed            — not approved, or already claimed for the bank.
 * The code is fetched on demand and kept only in component state.
 */

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const day = (d: string | null | undefined) => (d ? dayjs(d).format("D MMM") : "");
const BY_SLUG = new Map(CARDS.map((c) => [c.slug, c]));

const isExpired = (c: RewardClaim) => !!c.voucher?.expiry && dayjs(c.voucher.expiry).endOf("day").isBefore(dayjs());

/** Upright card art, or the card's colours when there's no art. */
export function CardArt({ slug, className }: { slug: string; className?: string }) {
  const card = BY_SLUG.get(slug);
  const img = card?.image;
  return (
    <span
      aria-hidden
      className={cn(
        "relative block shrink-0 overflow-hidden rounded-[6px] shadow-[0_8px_20px_-8px_rgba(0,0,0,0.9)] ring-1 ring-white/15",
        className,
      )}
      style={
        img || !card
          ? { background: "rgba(255,255,255,0.06)" }
          : { background: `linear-gradient(160deg, ${card.face.to}, ${card.face.from})` }
      }
    >
      {img && (
        <Image
          src={img.src}
          alt=""
          width={img.width}
          height={img.height}
          sizes="64px"
          className={
            img.width > img.height
              ? "absolute left-1/2 top-1/2 h-auto w-[158.6%] max-w-none -translate-x-1/2 -translate-y-1/2 rotate-90"
              : "size-full object-cover"
          }
        />
      )}
    </span>
  );
}

function SectionLabel({ children, count }: { children: React.ReactNode; count: number }) {
  return (
    <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
      {children}
      <span className="rounded-full bg-white/[0.06] px-1.5 py-px text-[10px] tabular-nums tracking-normal text-white/55">
        {count}
      </span>
    </h2>
  );
}

// ---- ready to use: the gift card ----------------------------------------------

/** Scratch-strip pattern behind a hidden code. */
const MASK =
  "repeating-linear-gradient(135deg, rgba(255,255,255,0.10) 0 5px, rgba(255,255,255,0.04) 5px 10px)";

function CodeRow({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string | null;
  onCopy: () => void;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex h-12 items-center gap-3 px-4">
      <span className="w-9 shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
        {label}
      </span>
      {value ? (
        <code className="min-w-0 flex-1 truncate font-mono text-[15px] tracking-[0.12em] text-white motion-safe:animate-in motion-safe:fade-in-0">
          {value}
        </code>
      ) : (
        <span aria-hidden className="h-5 min-w-0 flex-1 rounded" style={{ background: MASK }} />
      )}
      <button
        type="button"
        aria-label={`Copy ${label.toLowerCase()}`}
        disabled={!value}
        onClick={async () => {
          if (!value) return;
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            onCopy();
            setTimeout(() => setCopied(false), 1600);
          } catch {
            toast.error("Couldn't copy. Select the text instead.");
          }
        }}
        className={cn(
          "inline-flex h-8 w-[76px] shrink-0 items-center justify-center gap-1 rounded-lg text-xs font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-primary-orange",
          value ? "text-white/80 hover:bg-white/10 hover:text-white" : "invisible",
        )}
      >
        {copied ? <Check className="size-3.5 text-secondary-success" /> : <Copy className="size-3.5" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

function GiftCard({ claim }: { claim: RewardClaim }) {
  const [reveal, { isLoading }] = useRevealVoucherMutation();
  const [setUsed, { isLoading: marking }] = useSetVoucherUsedMutation();
  const [voucher, setVoucher] = useState<RevealedVoucher | null>(null);
  const v = claim.voucher!;
  const event = { campaign: claim.campaign, cardSlug: claim.cardSlug, amount: v.amount };

  const onReveal = async () => {
    try {
      setVoucher(await reveal(claim.id).unwrap());
      trackEvent(EventName.CASHBACK_VOUCHER_REVEALED, event);
    } catch {
      toast.error("Couldn't open your voucher. Check your connection and try again.");
    }
  };

  const onUsed = async () => {
    try {
      await setUsed({ id: claim.id, used: true }).unwrap();
      trackEvent(EventName.CASHBACK_VOUCHER_MARKED_USED, { ...event, used: true });
      toast.success("Moved to Used or expired");
    } catch {
      toast.error("Couldn't update the voucher. Try again.");
    }
  };

  return (
    <article className="relative overflow-hidden rounded-[22px] border border-white/10 bg-[#2a1c15] shadow-[0_30px_60px_-30px_rgba(0,0,0,0.9)]">
      {/* warm glow + fine engraving, like printed gift-card stock */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 100% 0%, color-mix(in oklch, var(--primary-orange) 38%, transparent), transparent 55%), repeating-radial-gradient(circle at 100% 0%, rgba(255,255,255,0.035) 0 1px, transparent 1px 9px)",
        }}
      />

      <div className="relative p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">
              Gift voucher
              {!v.revealed && !voucher && (
                <span className="rounded-full bg-primary-orange px-1.5 py-px text-[9px] tracking-[0.08em] text-white">
                  New
                </span>
              )}
            </p>
            <h3 className="mt-1.5 truncate text-[26px] font-bold capitalize leading-tight tracking-tight text-white">
              {v.brand}
            </h3>
          </div>
          <p className="shrink-0 font-satoshi text-[40px] font-bold leading-none tabular-nums tracking-tight text-white">
            {inr(v.amount)}
          </p>
        </div>

        <div className="mt-3 flex items-center gap-2 text-[13px] text-white/60">
          <CardArt slug={claim.cardSlug} className="h-[26px] w-4 rounded-[3px]" />
          For your {claim.cardName}
        </div>

        {/* code strip: fixed rows, so revealing swaps text in place */}
        <div className="relative mt-5 overflow-hidden rounded-2xl border border-white/10 bg-black/40">
          <div className={cn(v.hasPin && "divide-y divide-white/[0.07]")}>
            <CodeRow
              label="Code"
              value={voucher?.code ?? null}
              onCopy={() => trackEvent(EventName.CASHBACK_VOUCHER_COPIED, { ...event, field: "code" })}
            />
            {v.hasPin && (
              <CodeRow
                label="PIN"
                value={voucher?.pin ?? null}
                onCopy={() => trackEvent(EventName.CASHBACK_VOUCHER_COPIED, { ...event, field: "pin" })}
              />
            )}
          </div>
          {!voucher && (
            <button
              type="button"
              onClick={onReveal}
              disabled={isLoading}
              className="absolute inset-0 flex items-center justify-center gap-2 bg-black/10 text-sm font-semibold text-white outline-none transition hover:bg-black/25 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-orange"
            >
              <span className="inline-flex items-center gap-2 rounded-full bg-primary-orange px-4 py-2 shadow-[0_10px_24px_-10px_var(--primary-orange)]">
                {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Eye className="size-4" />}
                {v.revealed ? "Show code" : "Reveal code"}
              </span>
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs text-white/50">
          <span>
            {v.expiry ? `Use by ${dayjs(v.expiry).format("D MMM YYYY")}` : `Issued ${day(claim.issuedAt)}`}
            {voucher && <span className="text-white/35"> · keep this code private</span>}
          </span>
          <button
            type="button"
            onClick={onUsed}
            disabled={marking}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 font-semibold text-white/80 outline-none transition hover:border-white/35 hover:text-white focus-visible:ring-2 focus-visible:ring-primary-orange disabled:opacity-50"
          >
            {marking ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
            Mark as used
          </button>
        </div>
      </div>
    </article>
  );
}

// ---- on its way --------------------------------------------------------------

const STEPS = ["Applied", "Approved", "Voucher"] as const;

function Track({ claim }: { claim: RewardClaim }) {
  const reached = claim.status === "approved" ? 2 : 1;
  return (
    <div className="mt-4">
      <div className="grid grid-cols-3 gap-1.5" aria-hidden>
        {STEPS.map((s, i) => (
          <span
            key={s}
            className={cn("relative h-1.5 overflow-hidden rounded-full bg-white/[0.08]", i < reached && "bg-primary-orange")}
          >
            {i === reached && (
              <span className="absolute inset-y-0 left-0 w-1/2 rounded-full bg-primary-orange/60 motion-safe:animate-pulse" />
            )}
          </span>
        ))}
      </div>
      <ol className="mt-2 grid grid-cols-3 gap-1.5 text-[11px]">
        {STEPS.map((s, i) => (
          <li
            key={s}
            className={cn(i < reached ? "text-white/70" : i === reached ? "font-medium text-white" : "text-white/35")}
          >
            {s}
            {i === 0 && <span className="text-white/40"> · {day(claim.appliedAt)}</span>}
            {i === 1 && claim.approvedAt && <span className="text-white/40"> · {day(claim.approvedAt)}</span>}
          </li>
        ))}
      </ol>
    </div>
  );
}

function InProgress({ claim }: { claim: RewardClaim }) {
  const approved = claim.status === "approved";
  const dueBy = approved && claim.approvedAt ? dayjs(claim.approvedAt).add(48, "hour").format("D MMM") : null;
  return (
    <article className="flex gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 sm:p-5">
      <CardArt slug={claim.cardSlug} className="h-[70px] w-11 sm:h-[86px] sm:w-[54px]" />
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-3">
          <div className="mr-auto min-w-0">
            <h3 className="truncate text-[15px] font-semibold text-white">{claim.cardName}</h3>
            <p className="mt-0.5 text-[13px] text-white/60">
              {approved ? (
                <>
                  <span className="text-secondary-success">Approved</span> · voucher by {dueBy}
                </>
              ) : (
                <>Waiting for {claim.bank} to decide</>
              )}
            </p>
          </div>
          <p className="shrink-0 text-right">
            <span className="block text-xl font-bold tabular-nums leading-none text-white">{inr(claim.amount)}</span>
            <span className="text-[11px] text-white/45">voucher</span>
          </p>
        </div>
        <Track claim={claim} />
      </div>
    </article>
  );
}

// ---- used or expired, closed ---------------------------------------------------

function UsedRow({ claim }: { claim: RewardClaim }) {
  const [setUsed, { isLoading }] = useSetVoucherUsedMutation();
  const v = claim.voucher!;
  const expired = !v.usedAt && isExpired(claim);
  return (
    <li className="flex items-center gap-3 py-3">
      <CardArt slug={claim.cardSlug} className="h-9 w-[23px] opacity-60" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-white/75">
          <span className="capitalize">{v.brand}</span> voucher · {inr(v.amount)}
        </p>
        <p className="truncate text-xs text-white/40">
          {expired ? `Expired ${day(v.expiry)}` : `Marked used ${day(v.usedAt)}`} · {claim.cardName}
        </p>
      </div>
      {!expired && (
        <button
          type="button"
          disabled={isLoading}
          onClick={async () => {
            try {
              await setUsed({ id: claim.id, used: false }).unwrap();
              trackEvent(EventName.CASHBACK_VOUCHER_MARKED_USED, {
                campaign: claim.campaign,
                cardSlug: claim.cardSlug,
                amount: v.amount,
                used: false,
              });
            } catch {
              toast.error("Couldn't update the voucher. Try again.");
            }
          }}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-white/60 outline-none hover:bg-white/5 hover:text-white focus-visible:ring-2 focus-visible:ring-primary-orange"
        >
          {isLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Undo2 className="size-3.5" />}
          Not used yet
        </button>
      )}
    </li>
  );
}

function ClosedRow({ claim }: { claim: RewardClaim }) {
  const reason =
    claim.status === "rejected"
      ? "Not approved by the bank · no joining fee charged"
      : `Already claimed for ${claim.bank} · one voucher per bank`;
  return (
    <li className="flex items-center gap-3 py-3">
      <CardArt slug={claim.cardSlug} className="h-9 w-[23px] opacity-50 grayscale" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-white/70">{claim.cardName}</p>
        <p className="truncate text-xs text-white/40">{reason}</p>
      </div>
      <span className="shrink-0 text-sm tabular-nums text-white/35 line-through">{inr(claim.amount)}</span>
    </li>
  );
}

// ---- grouping ------------------------------------------------------------------

export function groupClaims(claims: RewardClaim[]) {
  const issued = claims.filter((c) => c.status === "issued" && c.voucher);
  return {
    ready: issued
      .filter((c) => !c.voucher!.usedAt && !isExpired(c))
      .sort((a, b) => Number(!!a.voucher?.revealed) - Number(!!b.voucher?.revealed)),
    coming: claims
      .filter((c) => c.status === "applied" || c.status === "approved")
      .sort((a, b) => Number(b.status === "approved") - Number(a.status === "approved")),
    used: issued.filter((c) => !!c.voucher!.usedAt || isExpired(c)),
    closed: claims.filter((c) => c.status === "rejected" || c.status === "duplicate_bank"),
  };
}

export function RewardsSummary({ claims }: { claims: RewardClaim[] }) {
  const g = groupClaims(claims);
  const ready = g.ready.reduce((s, c) => s + c.amount, 0);
  const coming = g.coming.reduce((s, c) => s + c.amount, 0);
  if (!ready && !coming) return null;
  return (
    <p className="text-[15px] text-white/60">
      {ready > 0 && (
        <>
          <span className="font-semibold text-white">{inr(ready)}</span> ready to use
        </>
      )}
      {ready > 0 && coming > 0 && <span className="px-2 text-white/25">·</span>}
      {coming > 0 && (
        <>
          <span className="font-semibold text-white">{inr(coming)}</span> on its way
        </>
      )}
    </p>
  );
}

export default function RewardsList({ claims }: { claims: RewardClaim[] }) {
  const { ready, coming, used, closed } = groupClaims(claims);
  return (
    <div className="flex flex-col gap-9">
      {ready.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionLabel count={ready.length}>Ready to use</SectionLabel>
          {ready.map((c) => (
            <GiftCard key={c.id} claim={c} />
          ))}
        </section>
      )}
      {coming.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionLabel count={coming.length}>On its way</SectionLabel>
          {coming.map((c) => (
            <InProgress key={c.id} claim={c} />
          ))}
        </section>
      )}
      {used.length > 0 && (
        <section className="flex flex-col gap-1">
          <SectionLabel count={used.length}>Used or expired</SectionLabel>
          <ul className="divide-y divide-white/[0.06]">
            {used.map((c) => (
              <UsedRow key={c.id} claim={c} />
            ))}
          </ul>
        </section>
      )}
      {closed.length > 0 && (
        <section className="flex flex-col gap-1">
          <SectionLabel count={closed.length}>Closed</SectionLabel>
          <ul className="divide-y divide-white/[0.06]">
            {closed.map((c) => (
              <ClosedRow key={c.id} claim={c} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
