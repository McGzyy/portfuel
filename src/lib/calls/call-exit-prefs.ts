import { createServiceClient } from "@/lib/db/supabase";

export type CallExitPrefs = {
  autoCloseOnStop: boolean;
  autoCloseOnTarget: boolean;
};

export const DEFAULT_CALL_EXIT_PREFS: CallExitPrefs = {
  autoCloseOnStop: true,
  autoCloseOnTarget: true,
};

function isMissingExitPrefsColumn(error: { message?: string } | null): boolean {
  const msg = (error?.message ?? "").toLowerCase();
  return msg.includes("auto_close_on_stop") || msg.includes("auto_close_on_target");
}

export async function fetchCallExitPrefs(userId: string): Promise<CallExitPrefs> {
  const db = createServiceClient();
  const { data, error } = await db
    .from("users")
    .select("auto_close_on_stop, auto_close_on_target")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    if (isMissingExitPrefsColumn(error)) return DEFAULT_CALL_EXIT_PREFS;
    console.error("[call-exit-prefs]", error);
    return DEFAULT_CALL_EXIT_PREFS;
  }

  if (!data) return DEFAULT_CALL_EXIT_PREFS;

  const row = data as {
    auto_close_on_stop?: boolean;
    auto_close_on_target?: boolean;
  };

  return {
    autoCloseOnStop: row.auto_close_on_stop ?? true,
    autoCloseOnTarget: row.auto_close_on_target ?? true,
  };
}

export async function fetchCallExitPrefsByUserIds(
  userIds: string[]
): Promise<Map<string, CallExitPrefs>> {
  const unique = [...new Set(userIds)];
  const map = new Map<string, CallExitPrefs>();
  if (unique.length === 0) return map;

  const db = createServiceClient();
  const { data, error } = await db
    .from("users")
    .select("id, auto_close_on_stop, auto_close_on_target")
    .in("id", unique);

  if (error) {
    if (isMissingExitPrefsColumn(error)) {
      for (const id of unique) map.set(id, DEFAULT_CALL_EXIT_PREFS);
      return map;
    }
    console.error("[call-exit-prefs/batch]", error);
    for (const id of unique) map.set(id, DEFAULT_CALL_EXIT_PREFS);
    return map;
  }

  for (const id of unique) {
    map.set(id, DEFAULT_CALL_EXIT_PREFS);
  }

  for (const row of data ?? []) {
    const r = row as {
      id: string;
      auto_close_on_stop?: boolean;
      auto_close_on_target?: boolean;
    };
    map.set(r.id, {
      autoCloseOnStop: r.auto_close_on_stop ?? true,
      autoCloseOnTarget: r.auto_close_on_target ?? true,
    });
  }

  return map;
}
