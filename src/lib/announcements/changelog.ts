import { createServiceClient } from "@/lib/db/supabase";
import { audienceMatches } from "@/lib/announcements/changelog-audience";
import type { SiteAnnouncement } from "@/lib/announcements/types";
import type { SessionPayload } from "@/lib/auth/session";

export type ChangelogEntry = SiteAnnouncement & {
  dismissed: boolean;
  isLive: boolean;
};

function rowToAnnouncement(row: Record<string, unknown>): SiteAnnouncement {
  return row as unknown as SiteAnnouncement;
}

function isLiveAnnouncement(a: SiteAnnouncement, nowMs: number): boolean {
  if (!a.is_active) return false;
  if (new Date(a.starts_at).getTime() > nowMs) return false;
  if (a.ends_at && new Date(a.ends_at).getTime() <= nowMs) return false;
  return true;
}

export async function fetchChangelogForUser(
  userId: string,
  session: SessionPayload,
  limit = 40
): Promise<ChangelogEntry[]> {
  const db = createServiceClient();
  const now = new Date().toISOString();
  const nowMs = Date.now();

  const { data: rows, error } = await db
    .from("site_announcements")
    .select("*")
    .lte("starts_at", now)
    .order("starts_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  const { data: dismissed } = await db
    .from("user_announcement_dismissals")
    .select("announcement_id")
    .eq("user_id", userId);

  const dismissedIds = new Set((dismissed ?? []).map((d) => d.announcement_id));

  return (rows ?? [])
    .map((row) => rowToAnnouncement(row as Record<string, unknown>))
    .filter((a) => audienceMatches(a.audience, session))
    .map((a) => ({
      ...a,
      dismissed: dismissedIds.has(a.id),
      isLive: isLiveAnnouncement(a, nowMs),
    }));
}

export function countUnreadWhatsNew(entries: ChangelogEntry[]): number {
  return entries.filter((e) => e.isLive && !e.dismissed).length;
}
