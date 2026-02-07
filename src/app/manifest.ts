import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FiSense",
    short_name: "FiSense",
    description: "Find the credit card built for you",
    start_url: "/",
    display: "standalone",
    background_color: "#111111",
    theme_color: "#1E1610",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/logo-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/logo-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
