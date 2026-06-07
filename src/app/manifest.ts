import type { MetadataRoute } from "next";
import { pwaIconUrl } from "@/lib/pwa/icons";

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
    background_color: "#e31b23",
    theme_color: "#e31b23",
    icons: [
      {
        src: pwaIconUrl("/icons/icon-192.png"),
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: pwaIconUrl("/icons/icon-512.png"),
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: pwaIconUrl("/icons/icon-512-maskable.png"),
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
