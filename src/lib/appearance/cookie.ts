import { cookies } from "next/headers";
import {
  DEFAULT_APPEARANCE,
  parseIconTheme,
  parseThemeMode,
  resolveIconVariant,
} from "@/lib/appearance/types";
import {
  appearancePwaIcons,
  pwaIconUrl,
  tileColorForPrefs,
} from "@/lib/pwa/icons";

export const APPEARANCE_COOKIE = "portfuel_appearance";

export function parseAppearanceCookie(raw: string | undefined) {
  if (!raw) return DEFAULT_APPEARANCE;
  try {
    const parsed = JSON.parse(raw) as { themeMode?: unknown; iconTheme?: unknown };
    return {
      themeMode: parseThemeMode(parsed.themeMode),
      iconTheme: parseIconTheme(parsed.iconTheme),
    };
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

export async function readAppearanceFromCookies() {
  const jar = await cookies();
  return parseAppearanceCookie(jar.get(APPEARANCE_COOKIE)?.value);
}

export function serializeAppearanceCookie(prefs: {
  themeMode: string;
  iconTheme: string;
}): string {
  return JSON.stringify({
    themeMode: parseThemeMode(prefs.themeMode),
    iconTheme: parseIconTheme(prefs.iconTheme),
  });
}

export async function readManifestAppearance() {
  return readAppearanceFromCookies();
}

export function manifestFromAppearance(prefs: ReturnType<typeof parseAppearanceCookie>) {
  const icons = appearancePwaIcons(prefs);
  const variant = resolveIconVariant(prefs);
  return {
    background_color: tileColorForPrefs(prefs),
    icons: [
      {
        src: pwaIconUrl(icons.icon192),
        sizes: "192x192",
        type: "image/png" as const,
        purpose: "any" as const,
      },
      {
        src: pwaIconUrl(icons.icon512),
        sizes: "512x512",
        type: "image/png" as const,
        purpose: "any" as const,
      },
      {
        src: pwaIconUrl(icons.maskable512),
        sizes: "512x512",
        type: "image/png" as const,
        purpose: "maskable" as const,
      },
    ],
    variant,
  };
}
