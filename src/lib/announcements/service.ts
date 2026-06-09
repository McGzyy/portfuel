import { createServiceClient } from "@/lib/db/supabase";
import { audienceMatches } from "@/lib/announcements/changelog-audience";
import type { SessionPayload } from "@/lib/auth/session";
import type { SiteAnnouncement } from "@/lib/announcements/types";

function rowToAnnouncement(row: Record<string, unknown>): SiteAnnouncement {
  return row as unknown as SiteAnnouncement;
}

export async function listAnnouncementsAdmin(): Promise<SiteAnnouncement[]> {
  const db = createServiceClient();
  const { data, error } = await db
    .from("site_announcements")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []).map((row) => rowToAnnouncement(row as Record<string, unknown>));
}

export async function fetchActiveAnnouncementsForUser(
  userId: string,
  session: SessionPayload
): Promise<SiteAnnouncement[]> {
  const db = createServiceClient();
  const now = new Date().toISOString();

  const { data: rows, error } = await db
    .from("site_announcements")
    .select("*")
    .eq("is_active", true)
    .lte("starts_at", now)
    .order("starts_at", { ascending: false })
    .limit(20);
  if (error) throw error;

  const { data: dismissed } = await db
    .from("user_announcement_dismissals")
    .select("announcement_id")
    .eq("user_id", userId);
  const dismissedIds = new Set((dismissed ?? []).map((d) => d.announcement_id));

  return (rows ?? [])
    .map((row) => rowToAnnouncement(row as Record<string, unknown>))
    .filter((a) => {
      if (dismissedIds.has(a.id)) return false;
      if (a.ends_at && new Date(a.ends_at).getTime() <= Date.now()) return false;
      return audienceMatches(a.audience, session);
    });
}

export async function createAnnouncement(
  input: {
    title: string;
    body: string;
    severity: SiteAnnouncement["severity"];
    audience: SiteAnnouncement["audience"];
    linkUrl?: string | null;
    linkLabel?: string | null;
    startsAt?: string;
    endsAt?: string | null;
  },
  adminUserId: string
): Promise<SiteAnnouncement> {
  const db = createServiceClient();
  const { data, error } = await db
    .from("site_announcements")
    .insert({
      title: input.title.trim(),
      body: input.body.trim(),
      severity: input.severity,
      audience: input.audience,
      link_url: input.linkUrl?.trim() || null,
      link_label: input.linkLabel?.trim() || null,
      starts_at: input.startsAt ?? new Date().toISOString(),
      ends_at: input.endsAt ?? null,
      created_by: adminUserId,
      updated_at: new Date().toISOString(),
    } as never)
    .select("*")
    .single();
  if (error) throw error;
  return rowToAnnouncement(data as Record<string, unknown>);
}

export async function updateAnnouncement(
  id: string,
  patch: Partial<{
    title: string;
    body: string;
    severity: SiteAnnouncement["severity"];
    audience: SiteAnnouncement["audience"];
    linkUrl: string | null;
    linkLabel: string | null;
    startsAt: string;
    endsAt: string | null;
    isActive: boolean;
  }>
): Promise<SiteAnnouncement | null> {
  const db = createServiceClient();
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.title !== undefined) update.title = patch.title.trim();
  if (patch.body !== undefined) update.body = patch.body.trim();
  if (patch.severity !== undefined) update.severity = patch.severity;
  if (patch.audience !== undefined) update.audience = patch.audience;
  if (patch.linkUrl !== undefined) update.link_url = patch.linkUrl?.trim() || null;
  if (patch.linkLabel !== undefined) update.link_label = patch.linkLabel?.trim() || null;
  if (patch.startsAt !== undefined) update.starts_at = patch.startsAt;
  if (patch.endsAt !== undefined) update.ends_at = patch.endsAt;
  if (patch.isActive !== undefined) update.is_active = patch.isActive;

  const { data, error } = await db
    .from("site_announcements")
    .update(update as never)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data ? rowToAnnouncement(data as Record<string, unknown>) : null;
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const db = createServiceClient();
  const { error } = await db.from("site_announcements").delete().eq("id", id);
  if (error) throw error;
}

export async function dismissAnnouncement(
  userId: string,
  announcementId: string
): Promise<void> {
  const db = createServiceClient();
  const { error } = await db.from("user_announcement_dismissals").upsert(
    {
      user_id: userId,
      announcement_id: announcementId,
      dismissed_at: new Date().toISOString(),
    } as never,
    { onConflict: "user_id,announcement_id" }
  );
  if (error) throw error;
}
