"use client";

// Renders the output of the two-pass card detector.
//
// The point of this panel is auditability: every row shows not just WHAT was
// detected but the three axes that produced the verdict (existence, resolution,
// liveness) and the emails backing it. If a card lands in the wrong bucket, the
// row itself should tell you which axis was wrong.

import { useState } from "react";

import { Button } from "@/components/ui/button";
import type {
  DetectVerdict,
  DetectedCard,
  DetectionResult,
} from "@/lib/unipile/demoClient";

const VERDICT_META: Record<
  DetectVerdict,
  { label: string; blurb: string; chip: string; ring: string }
> = {
  AUTO_ADD: {
    label: "Auto-add",
    blurb: "Confident enough to add without asking.",
    chip: "bg-green-500/15 text-green-300 border border-green-500/30",
    ring: "border-green-500/30",
  },
  CONFIRM: {
    label: "Needs confirmation",
    blurb: "Real card, but something is unresolved — ask the user.",
    chip: "bg-amber-500/15 text-amber-300 border border-amber-500/30",
    ring: "border-amber-500/25",
  },
  SUPPRESS: {
    label: "Suppressed",
    blurb: "Issuer mail says this card is gone.",
    chip: "bg-red-500/15 text-red-300 border border-red-500/30",
    ring: "border-red-500/20",
  },
  IGNORE: {
    label: "Ignored",
    blurb: "Too weak to claim a card exists.",
    chip: "bg-white/10 text-white/60 border border-white/20",
    ring: "border-white/10",
  },
};

const LIVENESS_CHIP: Record<string, string> = {
  ACTIVE: "bg-green-500/10 text-green-300",
  DORMANT: "bg-amber-500/10 text-amber-300",
  STALE: "bg-white/10 text-white/50",
};

const SIGNAL_CHIP: Record<string, string> = {
  STATEMENT: "bg-sky-500/15 text-sky-300",
  TRANSACTION: "bg-violet-500/15 text-violet-300",
  PAYMENT_DUE: "bg-teal-500/15 text-teal-300",
  ACTIVATION: "bg-indigo-500/15 text-indigo-300",
  MARKETING: "bg-white/10 text-white/45",
};

const ORDER: DetectVerdict[] = ["AUTO_ADD", "CONFIRM", "SUPPRESS", "IGNORE"];

function Axis({
  name,
  value,
  detail,
  tone,
}: {
  name: string;
  value: string;
  detail: string;
  tone?: string;
}) {
  return (
    <div className="min-w-0 flex-1 rounded-lg bg-black/25 p-3">
      <div className="text-[10px] uppercase tracking-wider text-white/35">{name}</div>
      <div
        className={`mt-1 inline-block rounded px-1.5 py-0.5 text-sm font-medium ${tone ?? "text-white"}`}
      >
        {value}
      </div>
      <div className="mt-1 break-words text-xs leading-relaxed text-white/50">{detail}</div>
    </div>
  );
}

function CardRow({ card }: { card: DetectedCard }) {
  const [open, setOpen] = useState(false);
  const meta = VERDICT_META[card.verdict];
  const res = card.resolution;

  const title =
    res.status === "UNIQUE" && res.candidates[0]
      ? res.candidates[0].name
      : (res.phrase ?? `${card.issuer.toUpperCase()} credit card`);

  return (
    <li className={`space-y-3 rounded-xl border bg-white/[0.02] p-4 ${meta.ring}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-white">{title}</span>
            <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-xs text-white/70">
              ••{card.last4}
            </span>
            <span className="rounded bg-white/5 px-2 py-0.5 text-xs uppercase text-white/45">
              {card.issuer}
            </span>
          </div>
          <p className="mt-1 text-xs text-white/55">{card.reason}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${meta.chip}`}>
          {meta.label}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <Axis
          name="Existence"
          value={card.existence.score.toFixed(2)}
          detail={`strongest: ${card.existence.strongest}`}
          tone={card.existence.score >= 0.95 ? "text-green-300" : "text-amber-300"}
        />
        <Axis
          name="Resolution"
          value={res.status}
          detail={
            res.candidates.length > 0
              ? res.candidates.map((c) => c.slug).join("  ·  ")
              : "no catalog match"
          }
          tone={
            res.status === "UNIQUE"
              ? "text-green-300"
              : res.status === "AMBIGUOUS"
                ? "text-amber-300"
                : "text-white/60"
          }
        />
        <Axis
          name="Liveness"
          value={card.liveness.status}
          detail={
            card.liveness.negative
              ? `negative: ${card.liveness.negative}`
              : card.liveness.daysAgo === null
                ? "never seen in non-promo mail"
                : `last seen ${card.liveness.daysAgo}d ago`
          }
          tone={
            card.liveness.status === "ACTIVE"
              ? "text-green-300"
              : card.liveness.status === "DORMANT"
                ? "text-amber-300"
                : "text-white/60"
          }
        />
      </div>

      {res.status === "AMBIGUOUS" && res.candidates.length > 0 && (
        <div className="space-y-1 rounded-lg border border-amber-500/20 bg-amber-500/[0.04] p-3">
          <div className="text-xs font-semibold text-amber-300/90">
            Which one do you have?
          </div>
          {res.candidates.map((c) => (
            <div key={c.slug} className="flex items-center justify-between gap-3 text-xs">
              <span className="min-w-0 truncate text-white/80">{c.name}</span>
              <span className="shrink-0 font-mono text-white/35">{c.slug}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase tracking-wider text-white/30">signals</span>
        {card.existence.signals.map((s) => (
          <span
            key={s}
            className={`rounded px-1.5 py-0.5 text-[11px] ${SIGNAL_CHIP[s] ?? "bg-white/10"}`}
          >
            {s}
          </span>
        ))}
        <span className={`ml-auto rounded px-1.5 py-0.5 text-[11px] ${LIVENESS_CHIP[card.liveness.status]}`}>
          {card.liveness.lastSeen
            ? new Date(card.liveness.lastSeen).toLocaleDateString()
            : "no activity"}
        </span>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 px-2 text-xs text-white hover:bg-white/10"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Hide evidence" : `Evidence (${card.evidence.length})`}
        </Button>
      </div>

      {open && (
        <ul className="space-y-1 rounded-lg bg-black/30 p-3">
          {card.evidence.map((e) => (
            <li key={`${e.type}:${e.emailId}`} className="flex gap-2 text-xs">
              <span
                className={`h-fit shrink-0 rounded px-1.5 py-0.5 text-[10px] ${SIGNAL_CHIP[e.type] ?? "bg-white/10"}`}
              >
                {e.type}
              </span>
              <span className="w-20 shrink-0 text-white/40">
                {e.date ? new Date(e.date).toLocaleDateString() : "—"}
              </span>
              <span className="min-w-0 break-words text-white/70">{e.subject}</span>
            </li>
          ))}
          {card.evidence.length === 0 && (
            <li className="text-xs text-white/40">No evidence pointers.</li>
          )}
        </ul>
      )}
    </li>
  );
}

export default function DetectedCards({ data }: { data: DetectionResult }) {
  // Weak rows are hidden by default — they are the long tail and would bury the
  // actionable ones — but never dropped, because "why is my card missing?" has
  // to be answerable.
  const [showWeak, setShowWeak] = useState(false);
  const strong = data.cards.filter((c) => c.verdict === "AUTO_ADD" || c.verdict === "CONFIRM");
  const weak = data.cards.filter((c) => c.verdict === "SUPPRESS" || c.verdict === "IGNORE");

  const counts = ORDER.map((v) => ({
    verdict: v,
    n: data.cards.filter((c) => c.verdict === v).length,
  })).filter((c) => c.n > 0);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/60">
        <span>
          <strong className="text-white">{data.cards.length}</strong> candidate
          {data.cards.length === 1 ? "" : "s"}
        </span>
        <span>
          from <strong className="text-white">{data.emailsScanned.toLocaleString()}</strong>{" "}
          emails
        </span>
        <span>{data.issuersSeen.length} issuers</span>
        {counts.map((c) => (
          <span key={c.verdict} className={`rounded-full px-2 py-0.5 text-xs ${VERDICT_META[c.verdict].chip}`}>
            {c.n} {VERDICT_META[c.verdict].label.toLowerCase()}
          </span>
        ))}
      </div>

      {data.cards.length === 0 ? (
        <p className="rounded-xl border border-white/15 p-4 text-sm text-white/60">
          No cards detected. If this mailbox has never been synced, fetch issuer
          mail first — detection reads only what is already stored.
        </p>
      ) : (
        <>
          <ul className="space-y-3">
            {strong.map((c) => (
              <CardRow key={`${c.issuer}:${c.last4}`} card={c} />
            ))}
          </ul>

          {weak.length > 0 && (
            <div className="space-y-3">
              <button
                onClick={() => setShowWeak((v) => !v)}
                className="text-xs text-white/40 underline hover:text-white/70"
              >
                {showWeak ? "Hide" : "Show"} {weak.length} suppressed / ignored
              </button>
              {showWeak && (
                <ul className="space-y-3">
                  {weak.map((c) => (
                    <CardRow key={`${c.issuer}:${c.last4}`} card={c} />
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
