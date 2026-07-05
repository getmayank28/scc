"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAnalytics } from "@/lib/analytics/hooks/useAnalytics";
import { EventName } from "@/lib/analytics/types";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

interface SaleCTAProps {
  children: React.ReactNode;
  className?: string;
  size?: "lg" | "xl";
  /** Where the CTA sends the not-signed-in visitor. */
  href?: string;
  /** Marker for analytics — identifies which CTA on the page was clicked. */
  source?: string;
  /** Merchant key, forwarded to the CTA-click event for funnel breakdown. */
  merchant?: string;
  showArrow?: boolean;
  /** Stretch to the container width (mobile full-width CTAs). */
  block?: boolean;
}

/**
 * The single conversion action of the page: an orange pill (inherits the app's
 * default Button variant) that routes into the sign-in flow. Adds a hover lift,
 * tap feedback and a slow shine sweep. Motion collapses under reduced-motion.
 */
export function SaleCTA({
  children,
  className,
  size = "xl",
  href = "/sign-in?callbackUrl=%2Fsale%2Fcontinue",
  source,
  merchant,
  showArrow = true,
  block = false,
}: SaleCTAProps) {
  const reduced = usePrefersReducedMotion();
  const { track } = useAnalytics();

  return (
    <motion.div
      className={block ? "block w-full" : "inline-block"}
      whileHover={reduced ? undefined : { scale: 1.03 }}
      whileTap={reduced ? undefined : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
      <Button
        asChild
        size={size}
        className={cn(
          "group relative h-13 overflow-hidden rounded-full px-8 text-base shadow-[0_10px_40px_-12px] shadow-primary-orange/60 sm:h-14 sm:px-10 sm:text-lg",
          block && "w-full",
          className
        )}
      >
        <Link
          href={href}
          data-cta-source={source}
          onClick={() =>
            track(EventName.SALE_CTA_CLICKED, {
              source: source ?? "unknown",
              merchant,
            })
          }
        >
          {/* shine sweep */}
          {!reduced && (
            <motion.span
              aria-hidden
              className="absolute inset-y-0 -left-1/3 w-1/3 skew-x-[-20deg] bg-white/25 blur-md"
              initial={{ x: "-150%" }}
              animate={{ x: ["-150%", "450%"] }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                repeatDelay: 2.2,
                ease: "easeInOut",
              }}
            />
          )}
          <span className="relative z-10 font-semibold">{children}</span>
          {showArrow && (
            <ArrowRight className="relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
          )}
        </Link>
      </Button>
    </motion.div>
  );
}
