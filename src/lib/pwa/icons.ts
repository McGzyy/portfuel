/** Bump when home-screen / PWA icon PNGs change (cache bust for Safari + CDN). */
export const PWA_ICON_VERSION = "3";

/** Splash + manifest background — matches home-screen tile. */
export const PWA_TILE_COLOR = "#0a0c10";

export function pwaIconUrl(path: string): string {
  return `${path}?v=${PWA_ICON_VERSION}`;
}

/** Canonical paths — use these only (avoid legacy icon-192.png cache collisions). */
export const PWA_ICONS = {
  apple180: "/icons/pwa-apple-180.png",
  icon192: "/icons/pwa-192.png",
  icon512: "/icons/pwa-512.png",
  maskable512: "/icons/pwa-512-maskable.png",
  rootApple: "/apple-touch-icon.png",
} as const;
