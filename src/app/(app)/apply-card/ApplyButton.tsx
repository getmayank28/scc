"use client";

import { ArrowUpRight } from "lucide-react";
import { trackEvent } from "@/lib/analytics/track";
import { EventName } from "@/lib/analytics/types";
import { cn } from "@/lib/utils";

interface ApplyButtonProps {
  applyLink: string;
  cardName: string;
  className?: string;
  size?: "sm" | "md";
}

const ApplyButton = ({ applyLink, cardName, className, size = "md" }: ApplyButtonProps) => {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full border border-secondary-orange font-bold text-white bg-primary-orange/80 hover:opacity-90 transition-opacity";
  const sizes = size === "sm" ? "text-[12px] py-1 px-3" : "text-sm py-2.5 px-6";

  return (
    <a
      href={applyLink}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent(EventName.CHAT_CARD_APPLY_CLICKED, { cardName })}
      className={cn(base, sizes, className)}
    >
      <span>Apply now</span>
      <ArrowUpRight className="size-4" />
    </a>
  );
};

export default ApplyButton;
