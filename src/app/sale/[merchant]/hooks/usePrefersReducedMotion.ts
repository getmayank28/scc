"use client";

import { useReducedMotion } from "motion/react";

/**
 * Thin wrapper over motion's `useReducedMotion` so sale components import from a
 * single local path and always get a boolean (motion can return `null` before
 * hydration). When true, callers should swap animated variants for static ones.
 */
export function usePrefersReducedMotion(): boolean {
  return useReducedMotion() ?? false;
}
