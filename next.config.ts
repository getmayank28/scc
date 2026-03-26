import withPWA from "next-pwa";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ✅ Enable SWC minification (faster + smaller JS)
  swcMinify: true,

  // ✅ Remove console.logs in production (reduces JS size)
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  // ✅ Optimize images (important for FCP)
  // images: {
  //   formats: ["image/avif", "image/webp"] as const,
  // },
};

export default withPWA({
  dest: "public",

  // ✅ Disable PWA in dev (keep this)
  disable: process.env.NODE_ENV === "development",

  // ✅ Avoid caching huge JS bundles aggressively during development changes
  runtimeCaching: [],
})(nextConfig);
