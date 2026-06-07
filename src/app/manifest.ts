import type { MetadataRoute } from "next";
import { manifestFromAppearance, readManifestAppearance } from "@/lib/appearance/cookie";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const prefs = await readManifestAppearance();
  const { background_color, icons } = manifestFromAppearance(prefs);

  return {
    name: "PortFuel",
    short_name: "PortFuel",
    description:
      "Member intelligence workspace for curated stock and crypto theses, performance tracking, and community rankings.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color,
    theme_color: "#e31b23",
    icons,
  };
}
