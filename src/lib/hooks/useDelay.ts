import { useEffect, useState } from "react";

/**
 * Delays switching a boolean from true → false.
 * - true  → applied immediately
 * - false → applied after `delay` ms
 */
export function useDelayed(value: boolean, delay: number = 500): boolean {
  const [state, setState] = useState<boolean>(value);

  useEffect(() => {
    // Show immediately when value becomes true
    if (value) {
      setState(true);
      return;
    }

    // Delay hiding when value becomes false
    const timer: ReturnType<typeof setTimeout> = setTimeout(() => {
      setState(false);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return state;
}
