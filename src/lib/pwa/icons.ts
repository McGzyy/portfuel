/** Bump when home-screen / PWA icon PNGs change (cache bust for Safari + CDN). */
export const PWA_ICON_VERSION = "4";

import type { IconVariant } from "@/lib/appearance/types";
import { resolveIconVariant, type AppearancePrefs } from "@/lib/appearance/types";

export function pwaIconUrl(path: string): string {
  return `${path}?v=${PWA_ICON_VERSION}`;
}

export const PWA_TILE_COLORS: Record<IconVariant, string> = {
  dark: "#0a0c10",
  red: "#e31b23",
  light: "#ffffff",
};

/** Legacy default — dark tile. */
export const PWA_TILE_COLOR = PWA_TILE_COLORS.dark;

export function pwaIconsForVariant(variant: IconVariant) {
  return {
    apple180: `/icons/pwa-${variant}-apple-180.png`,
    icon192: `/icons/pwa-${variant}-192.png`,
    icon512: `/icons/pwa-${variant}-512.png`,
    maskable512: `/icons/pwa-${variant}-512-maskable.png`,
    rootApple: variant === "dark" ? "/apple-touch-icon.png" : `/apple-touch-icon-${variant}.png`,
  };
}

/** @deprecated Use pwaIconsForVariant — kept for redirects. */
export const PWA_ICONS = pwaIconsForVariant("dark");

export function appearancePwaIcons(prefs: AppearancePrefs) {
  return pwaIconsForVariant(resolveIconVariant(prefs));
}

export function tileColorForPrefs(prefs: AppearancePrefs): string {
  return PWA_TILE_COLORS[resolveIconVariant(prefs)];
}
