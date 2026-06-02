import { createServiceClient } from "@/lib/db/supabase";
import type { ModerationFlags, ModerationPreset } from "@/lib/member-lifecycle/types";

export const MODERATION_PRESETS: Record<
  Exclude<ModerationPreset, "clear">,
  ModerationFlags & { label: string }
> = {
  read_only: {
    label: "Read-only",
    canAccessWorkspace: true,
    canPublishCalls: false,
    canDm: false,
    canComment: false,
  },
  no_calls: {
    label: "No new calls",
    canAccessWorkspace: true,
    canPublishCalls: false,
    canDm: true,
    canComment: true,
  },
  no_dm: {
    label: "No DMs",
    canAccessWorkspace: true,
    canPublishCalls: true,
    canDm: false,
    canComment: true,
  },
  full_lock: {
    label: "Workspace locked",
    canAccessWorkspace: false,
    canPublishCalls: false,
    canDm: false,
    canComment: false,
  },
};

const DEFAULT_FLAGS: ModerationFlags = {
  canAccessWorkspace: true,
  canPublishCalls: true,
  canDm: true,
  canComment: true,
};

export function flagsFromRow(row: {
  can_access_workspace: boolean;
  can_publish_calls: boolean;
  can_dm: boolean;
  can_comment: boolean;
  banned_at: string | null;
  moderation_expires_at: string | null;
}): ModerationFlags & { banned: boolean; expired: boolean } {
  const expired =
    row.moderation_expires_at != null &&
    new Date(row.moderation_expires_at).getTime() <= Date.now();

  if (row.banned_at || expired) {
    return { ...DEFAULT_FLAGS, banned: Boolean(row.banned_at), expired };
  }

  return {
    canAccessWorkspace: row.can_access_workspace,
    canPublishCalls: row.can_publish_calls,
    canDm: row.can_dm,
    canComment: row.can_comment,
    banned: false,
    expired,
  };
}

export async function clearExpiredModeration(userId: string): Promise<void> {
  const db = createServiceClient();
  const { data } = await db
    .from("users")
    .select("moderation_expires_at")
    .eq("id", userId)
    .maybeSingle();

  if (!data?.moderation_expires_at) return;
  if (new Date(data.moderation_expires_at as string).getTime() > Date.now()) return;

  await db
    .from("users")
    .update({
      moderation_expires_at: null,
      can_access_workspace: true,
      can_publish_calls: true,
      can_dm: true,
      can_comment: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
}

export async function applyModerationPreset(
  userId: string,
  preset: ModerationPreset,
  expiresAt: string | null
): Promise<void> {
  const db = createServiceClient();

  if (preset === "clear") {
    await db
      .from("users")
      .update({
        moderation_expires_at: null,
        can_access_workspace: true,
        can_publish_calls: true,
        can_dm: true,
        can_comment: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
    return;
  }

  const flags = MODERATION_PRESETS[preset];
  await db
    .from("users")
    .update({
      can_access_workspace: flags.canAccessWorkspace,
      can_publish_calls: flags.canPublishCalls,
      can_dm: flags.canDm,
      can_comment: flags.canComment,
      moderation_expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
}

export async function banUser(userId: string): Promise<void> {
  const db = createServiceClient();
  await db
    .from("users")
    .update({
      banned_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
}

export async function unbanUser(userId: string): Promise<void> {
  const db = createServiceClient();
  await db
    .from("users")
    .update({
      banned_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
}
