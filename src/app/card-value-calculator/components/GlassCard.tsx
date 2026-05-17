"use client";
import { cn } from "@/lib/utils";
import { motion, type HTMLMotionProps } from "motion/react";
import type { ReactNode } from "react";

type GlassCardProps = HTMLMotionProps<"div"> & {
  children: ReactNode;
  glow?: boolean;
  glowColor?: string;
};

export function GlassCard({
  children,
  className,
  glow = false,
  glowColor = "rgba(243, 90, 19, 0.18)",
  ...rest
}: GlassCardProps) {
  return (
    <motion.div
      className={cn(
        "relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl",
        "shadow-[0_8px_30px_rgba(0,0,0,0.45)]",
        "overflow-hidden",
        className
      )}
      {...rest}
    >
      {glow && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background: `radial-gradient(600px circle at 0% 0%, ${glowColor}, transparent 40%)`,
          }}
        />
      )}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"
      />
      <div className="relative">{children}</div>
    </motion.div>
  );
}
