import { createServiceClient } from "@/lib/db/supabase";
import {
  DEFAULT_APPEARANCE,
  parseIconTheme,
  parseThemeMode,
  type AppearancePrefs,
} from "@/lib/appearance/types";

type AppearanceRow = {
  theme_mode: string | null;
  icon_theme: string | null;
};

function rowToPrefs(row: AppearanceRow | null): AppearancePrefs {
  if (!row) return DEFAULT_APPEARANCE;
  return {
    themeMode: parseThemeMode(row.theme_mode),
    iconTheme: parseIconTheme(row.icon_theme),
  };
}

export async function fetchAppearancePrefs(userId: string): Promise<AppearancePrefs> {
  try {
    const db = createServiceClient();
    const { data, error } = await db
      .from("users")
      .select("theme_mode, icon_theme")
      .eq("id", userId)
      .maybeSingle();
    if (error) {
      console.error("[appearance/fetch]", error);
      return DEFAULT_APPEARANCE;
    }
    return rowToPrefs(data as AppearanceRow | null);
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

export function appearanceFromUserRow(
  user:
    | { theme_mode?: string | null | undefined; icon_theme?: string | null | undefined }
    | null
    | undefined
): AppearancePrefs {
  if (!user) return DEFAULT_APPEARANCE;
  return rowToPrefs({
    theme_mode: user.theme_mode ?? null,
    icon_theme: user.icon_theme ?? null,
  });
}
