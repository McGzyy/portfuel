import type { MetadataRoute } from "next";
import { PWA_ICONS, PWA_TILE_COLOR, pwaIconUrl } from "@/lib/pwa/icons";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PortFuel",
    short_name: "PortFuel",
    description:
      "Member intelligence workspace for curated stock and crypto theses, performance tracking, and community rankings.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: PWA_TILE_COLOR,
    theme_color: "#e31b23",
    icons: [
      {
        src: pwaIconUrl(PWA_ICONS.icon192),
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: pwaIconUrl(PWA_ICONS.icon512),
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: pwaIconUrl(PWA_ICONS.maskable512),
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
