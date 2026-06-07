"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_APPEARANCE,
  resolveIconVariant,
  type AppearancePrefs,
  type IconTheme,
  type IconVariant,
  type ThemeMode,
} from "@/lib/appearance/types";
import { pwaIconUrl, pwaIconsForVariant, tileColorForPrefs } from "@/lib/pwa/icons";

type AppearanceContextValue = {
  enabled: boolean;
  prefs: AppearancePrefs;
  isDark: boolean;
  resolvedIconVariant: IconVariant;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setIconTheme: (theme: IconTheme) => Promise<void>;
  saving: boolean;
};

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

function applyDomAppearance(prefs: AppearancePrefs, enabled: boolean) {
  const root = document.documentElement;
  if (!enabled || prefs.themeMode !== "dark") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", "dark");
  }

  const variant = enabled ? resolveIconVariant(prefs) : "red";
  const icons = pwaIconsForVariant(variant);
  const href = pwaIconUrl(icons.apple180);

  let link = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "apple-touch-icon";
    document.head.appendChild(link);
  }
  if (link.href !== new URL(href, window.location.origin).href) {
    link.href = href;
  }

  const themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (themeMeta && enabled) {
    themeMeta.content = tileColorForPrefs(prefs);
  }
}

async function patchAppearance(body: Partial<AppearancePrefs>): Promise<AppearancePrefs> {
  const res = await fetch("/api/auth/appearance", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("appearance_update_failed");
  const data = (await res.json()) as AppearancePrefs;
  return data;
}

export function AppearanceProvider({
  enabled,
  initial,
  children,
}: {
  enabled: boolean;
  initial: AppearancePrefs;
  children: ReactNode;
}) {
  const [prefs, setPrefs] = useState(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    applyDomAppearance(prefs, enabled);
  }, [prefs, enabled]);

  const update = useCallback(
    async (next: Partial<AppearancePrefs>) => {
      const merged = { ...prefs, ...next };
      setPrefs(merged);
      applyDomAppearance(merged, enabled);
      setSaving(true);
      try {
        const saved = await patchAppearance(next);
        setPrefs(saved);
        applyDomAppearance(saved, enabled);
      } catch {
        setPrefs(prefs);
        applyDomAppearance(prefs, enabled);
      } finally {
        setSaving(false);
      }
    },
    [prefs, enabled]
  );

  const value = useMemo<AppearanceContextValue>(
    () => ({
      enabled,
      prefs,
      isDark: enabled && prefs.themeMode === "dark",
      resolvedIconVariant: resolveIconVariant(prefs),
      setThemeMode: (themeMode) => update({ themeMode }),
      setIconTheme: (iconTheme) => update({ iconTheme }),
      saving,
    }),
    [enabled, prefs, saving, update]
  );

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance(): AppearanceContextValue {
  const ctx = useContext(AppearanceContext);
  if (!ctx) {
    return {
      enabled: false,
      prefs: DEFAULT_APPEARANCE,
      isDark: false,
      resolvedIconVariant: "red",
      setThemeMode: async () => {},
      setIconTheme: async () => {},
      saving: false,
    };
  }
  return ctx;
}

export function useIsDarkMode(): boolean {
  return useAppearance().isDark;
}
