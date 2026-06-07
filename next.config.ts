import type { NextConfig } from "next";

const pwaIconSources = [
  "/icons/pwa-192.png",
  "/icons/pwa-512.png",
  "/icons/pwa-512-maskable.png",
  "/icons/pwa-apple-180.png",
  "/apple-touch-icon.png",
];

const noCache = [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }];

const nextConfig: NextConfig = {
  serverExternalPackages: ["@resvg/resvg-js", "dejavu-fonts-ttf"],
  async headers() {
    return [
      ...pwaIconSources.map((source) => ({ source, headers: noCache })),
      { source: "/manifest.webmanifest", headers: noCache },
    ];
  },
  async redirects() {
    return [
      { source: "/icons/icon-192.png", destination: "/icons/pwa-192.png?v=3", permanent: false },
      { source: "/icons/icon-512.png", destination: "/icons/pwa-512.png?v=3", permanent: false },
      {
        source: "/icons/icon-512-maskable.png",
        destination: "/icons/pwa-512-maskable.png?v=3",
        permanent: false,
      },
      {
        source: "/icons/apple-touch-icon.png",
        destination: "/icons/pwa-apple-180.png?v=3",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
