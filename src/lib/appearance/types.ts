export type ThemeMode = "light" | "dark";

export type IconTheme = "auto" | "dark" | "red" | "light";

export type IconVariant = "dark" | "red" | "light";

export type AppearancePrefs = {
  themeMode: ThemeMode;
  iconTheme: IconTheme;
};

export const DEFAULT_APPEARANCE: AppearancePrefs = {
  themeMode: "light",
  iconTheme: "auto",
};

export function parseThemeMode(raw: unknown): ThemeMode {
  return raw === "dark" ? "dark" : "light";
}

export function parseIconTheme(raw: unknown): IconTheme {
  if (raw === "dark" || raw === "red" || raw === "light") return raw;
  return "auto";
}

/** Resolved tile variant for PWA icons. */
export function resolveIconVariant(prefs: AppearancePrefs): IconVariant {
  if (prefs.iconTheme !== "auto") return prefs.iconTheme;
  return prefs.themeMode === "dark" ? "dark" : "red";
}
