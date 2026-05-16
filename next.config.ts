import withPWAInit from "@ducanh2912/next-pwa";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // ✅ Remove console.logs in production (reduces JS size)
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  // ✅ Optimize images (important for FCP)
  // images: {
  //   formats: ["image/avif", "image/webp"] as const,
  // },
};

const withPWA = withPWAInit({
  dest: "public",

  // ✅ Disable PWA in dev (keep this)
  disable: process.env.NODE_ENV === "development",

  // ✅ Avoid caching huge JS bundles aggressively during development changes
  workboxOptions: {
    runtimeCaching: [],
  },
});

export default withPWA(nextConfig);
