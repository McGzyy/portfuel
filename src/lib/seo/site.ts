import type { Metadata } from "next";
import { getAppOrigin } from "@/lib/social/app-url";
import { PWA_ICONS, pwaIconUrl } from "@/lib/pwa/icons";

/** Browser tab / OG branding — avoid generic “stock calls dashboard” copy */
export const SITE_NAME = "PortFuel";
export const SITE_TAGLINE = "Intelligence for serious traders";
export const SITE_DESCRIPTION =
  "Member intelligence workspace for curated stock and crypto theses, live performance tracking, and community rankings.";

export function pageTitle(segment?: string): Metadata["title"] {
  if (!segment) {
    return {
      default: `${SITE_NAME} — ${SITE_TAGLINE}`,
      template: `%s · ${SITE_NAME}`,
    };
  }
  return segment;
}

export const rootMetadata: Metadata = {
  metadataBase: new URL(getAppOrigin()),
  title: pageTitle(),
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  icons: {
    // Transparent gauge for browser tabs — not the red-tile PWA home-screen icons.
    icon: [{ url: "/icons/favicon.png", sizes: "48x48", type: "image/png" }],
    apple: [{ url: pwaIconUrl(PWA_ICONS.apple180), sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — ${SITE_TAGLINE}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: ["/opengraph-image"],
  },
};

export const workspaceMetadata: Metadata = {
  title: {
    default: `Overview · ${SITE_NAME}`,
    template: `%s · Workspace · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
};
