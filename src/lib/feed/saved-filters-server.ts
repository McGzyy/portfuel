import type { FeedFilter } from "@/lib/calls/filter-feed";
import type { FeedTab } from "@/lib/dashboard/nav";
import { createServiceClient } from "@/lib/db/supabase";
import {
  SAVED_FEED_PRESET_LIMIT,
  suggestFeedPresetName,
  viewMatchesPreset,
  type SavedFeedPreset,
} from "@/lib/feed/saved-filters";

type FeedSavedViewRow = {
  id: string;
  user_id: string;
  name: string;
  filter: FeedFilter;
  tab: FeedTab;
  search_query: string | null;
  new_since: boolean;
  sort_order: number;
  created_at: string;
};

function rowToPreset(row: FeedSavedViewRow): SavedFeedPreset {
  return {
    id: row.id,
    name: row.name,
    filter: row.filter,
    tab: row.tab,
    q: row.search_query?.trim() || undefined,
    newSince: row.new_since || undefined,
    savedAt: new Date(row.created_at).getTime(),
  };
}

export async function listUserFeedSavedViews(userId: string): Promise<SavedFeedPreset[]> {
  const db = createServiceClient();
  const { data, error } = await db
    .from("user_feed_saved_views")
    .select("id, user_id, name, filter, tab, search_query, new_since, sort_order, created_at")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(SAVED_FEED_PRESET_LIMIT);

  if (error) throw error;
  return ((data ?? []) as FeedSavedViewRow[]).map(rowToPreset);
}

export async function createUserFeedSavedView(
  userId: string,
  input: {
    name?: string;
    filter: FeedFilter;
    tab: FeedTab;
    q?: string;
    newSince?: boolean;
  }
): Promise<{ preset?: SavedFeedPreset; error?: "limit_reached" | "duplicate" }> {
  const db = createServiceClient();
  const existing = await listUserFeedSavedViews(userId);
  if (existing.length >= SAVED_FEED_PRESET_LIMIT) {
    return { error: "limit_reached" };
  }

  const view = {
    filter: input.filter,
    tab: input.tab,
    q: input.q?.trim() || undefined,
    newSince: input.newSince,
  };

  if (existing.some((p) => viewMatchesPreset(p, view))) {
    return { error: "duplicate" };
  }

  const name =
    input.name?.trim() ||
    suggestFeedPresetName({
      filter: input.filter,
      tab: input.tab,
      q: view.q,
      newSince: view.newSince,
    });

  const { data, error } = await db
    .from("user_feed_saved_views")
    .insert({
      user_id: userId,
      name: name.slice(0, 120),
      filter: input.filter,
      tab: input.tab,
      search_query: view.q ?? null,
      new_since: Boolean(view.newSince),
      sort_order: 0,
    } as never)
    .select("id, user_id, name, filter, tab, search_query, new_since, sort_order, created_at")
    .single();

  if (error) throw error;
  return { preset: rowToPreset(data as FeedSavedViewRow) };
}

export async function deleteUserFeedSavedView(
  userId: string,
  presetId: string
): Promise<boolean> {
  const db = createServiceClient();
  const { data, error } = await db
    .from("user_feed_saved_views")
    .delete()
    .eq("user_id", userId)
    .eq("id", presetId)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

export async function importLocalFeedPresets(
  userId: string,
  presets: SavedFeedPreset[]
): Promise<SavedFeedPreset[]> {
  const db = createServiceClient();
  const existing = await listUserFeedSavedViews(userId);
  if (existing.length > 0) return existing;

  const rows = presets.slice(0, SAVED_FEED_PRESET_LIMIT).map((preset, index) => ({
    user_id: userId,
    name: preset.name.slice(0, 120),
    filter: preset.filter,
    tab: preset.tab,
    search_query: preset.q?.trim() || null,
    new_since: Boolean(preset.newSince),
    sort_order: index,
  }));

  if (rows.length === 0) return [];

  const { error } = await db.from("user_feed_saved_views").insert(rows as never);
  if (error) throw error;
  return listUserFeedSavedViews(userId);
}
