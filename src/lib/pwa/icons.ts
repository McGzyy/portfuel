/** Bump when home-screen / PWA icon PNGs change (cache bust for Safari + CDN). */
export const PWA_ICON_VERSION = "2";

export function pwaIconUrl(path: string): string {
  return `${path}?v=${PWA_ICON_VERSION}`;
}
