import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import {
  ONBOARDING_DEFAULT_SYMBOLS,
  ONBOARDING_MAX_SYMBOLS,
  ONBOARDING_MIN_SYMBOLS,
} from "@/lib/onboarding/constants";
import { addToWatchlist } from "@/lib/watchlist/service";

export type OnboardingStatus = {
  completed: boolean;
  needsDisplayName: boolean;
  suggestions: string[];
};

export function needsOnboarding(row: {
  role: string;
  onboarding_completed_at?: string | null;
}): boolean {
  if (row.role === "admin") return false;
  return !row.onboarding_completed_at;
}

export async function fetchOnboardingSuggestions(): Promise<string[]> {
  const seen = new Set<string>();
  const out: string[] = [];

  function push(sym: string) {
    const s = sym.toUpperCase().trim();
    if (!s || seen.has(s) || out.length >= 12) return;
    seen.add(s);
    out.push(s);
  }

  if (!isDemoMode()) {
    try {
      const db = createServiceClient();
      const { data } = await db
        .from("desk_portfolio")
        .select("symbol")
        .eq("status", "open")
        .limit(8);
      for (const row of data ?? []) {
        push((row as { symbol: string }).symbol);
      }
    } catch (e) {
      console.error("[onboarding/suggestions]", e);
    }
  }

  for (const sym of ONBOARDING_DEFAULT_SYMBOLS) {
    push(sym);
  }

  return out;
}

export async function getOnboardingStatus(userId: string): Promise<OnboardingStatus> {
  if (isDemoMode()) {
    return {
      completed: true,
      needsDisplayName: false,
      suggestions: [...ONBOARDING_DEFAULT_SYMBOLS],
    };
  }

  const db = createServiceClient();
  const { data } = await db
    .from("users")
    .select("display_name, onboarding_completed_at, role")
    .eq("id", userId)
    .maybeSingle();

  const row = data as {
    display_name: string | null;
    onboarding_completed_at: string | null;
    role: string;
  } | null;

  return {
    completed: row ? !needsOnboarding(row) : false,
    needsDisplayName: !row?.display_name?.trim(),
    suggestions: await fetchOnboardingSuggestions(),
  };
}

export async function completeOnboarding(input: {
  userId: string;
  displayName?: string;
  symbols: string[];
}): Promise<{ ok: true } | { error: string }> {
  const symbols = [
    ...new Set(input.symbols.map((s) => s.toUpperCase().trim()).filter(Boolean)),
  ].slice(0, ONBOARDING_MAX_SYMBOLS);

  if (symbols.length < ONBOARDING_MIN_SYMBOLS) {
    return { error: "symbols_required" };
  }

  if (isDemoMode()) {
    return { ok: true };
  }

  const db = createServiceClient();

  if (input.displayName?.trim()) {
    const { error } = await db
      .from("users")
      .update({ display_name: input.displayName.trim() } as never)
      .eq("id", input.userId);
    if (error) {
      console.error("[onboarding/displayName]", error);
      return { error: "update_failed" };
    }
  }

  for (const sym of symbols) {
    const result = await addToWatchlist(input.userId, sym);
    if ("error" in result) {
      if (result.error === "watchlist_full") break;
      if (result.error === "db_error") return { error: "watchlist_failed" };
      continue;
    }
  }

  const { error } = await db
    .from("users")
    .update({ onboarding_completed_at: new Date().toISOString() } as never)
    .eq("id", input.userId);

  if (error) {
    console.error("[onboarding/complete]", error);
    return { error: "update_failed" };
  }

  return { ok: true };
}
