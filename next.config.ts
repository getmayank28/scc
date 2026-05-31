import withSerwistInit from "@serwist/next";
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

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

export default withSerwist(nextConfig);
