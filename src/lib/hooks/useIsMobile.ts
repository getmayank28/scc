"use client";
import { useState, useEffect } from "react";

interface UseIsMobileOptions {
  breakpoint?: number; // Default breakpoint for mobile (px)
  includeUserAgent?: boolean; // Whether to also check user agent
}

const useIsMobile = (options: UseIsMobileOptions = {}) => {
  const { breakpoint = 768, includeUserAgent = true } = options;

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      // Check screen width
      const isMobileByWidth = window.innerWidth <= breakpoint;

      // Check user agent if enabled
      let isMobileByUserAgent = false;
      if (includeUserAgent) {
        const userAgent = navigator.userAgent.toLowerCase();
        isMobileByUserAgent =
          /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
            userAgent
          );
      }

      // Device is considered mobile if either condition is true
      setIsMobile(isMobileByWidth || isMobileByUserAgent);
    };

    // Check on mount
    checkIsMobile();

    // Add resize listener
    window.addEventListener("resize", checkIsMobile);

    // Cleanup
    return () => {
      window.removeEventListener("resize", checkIsMobile);
    };
  }, [breakpoint, includeUserAgent]);

  return { isMobile };
};

export default useIsMobile;
