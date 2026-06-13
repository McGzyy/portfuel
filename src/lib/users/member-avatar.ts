import { createServiceClient, hasSupabaseConfig } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";

export const MEMBER_AVATAR_BUCKET = "member-avatars";
export const MEMBER_AVATAR_MAX_BYTES = 2 * 1024 * 1024;

export const MEMBER_AVATAR_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export function isMemberAvatarsEnabled(): boolean {
  return hasSupabaseConfig() && !isDemoMode();
}

export function validateMemberAvatarFile(file: {
  name: string;
  type: string;
  size: number;
}): string | null {
  if (file.size <= 0) return "Empty file.";
  if (file.size > MEMBER_AVATAR_MAX_BYTES) return "Photo must be 2 MB or smaller.";
  if (
    !MEMBER_AVATAR_MIME_TYPES.includes(
      file.type as (typeof MEMBER_AVATAR_MIME_TYPES)[number]
    )
  ) {
    return "Use JPG, PNG, or WebP.";
  }
  return null;
}

function extensionForMime(contentType: string): string {
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  return "jpg";
}

export function memberAvatarStoragePath(userId: string, contentType: string): string {
  return `${userId}/avatar.${extensionForMime(contentType)}`;
}

export async function uploadMemberAvatar(opts: {
  userId: string;
  contentType: string;
  data: Buffer;
}): Promise<string> {
  if (!isMemberAvatarsEnabled()) {
    throw new Error("avatars_unavailable");
  }

  const db = createServiceClient();
  const storagePath = memberAvatarStoragePath(opts.userId, opts.contentType);

  const { error: uploadError } = await db.storage
    .from(MEMBER_AVATAR_BUCKET)
    .upload(storagePath, opts.data, {
      contentType: opts.contentType,
      upsert: true,
      cacheControl: "3600",
    });

  if (uploadError) {
    console.error("[member-avatar/upload]", uploadError);
    throw new Error("upload_failed");
  }

  const { data: publicUrl } = db.storage.from(MEMBER_AVATAR_BUCKET).getPublicUrl(storagePath);
  const versioned = `${publicUrl.publicUrl}?v=${Date.now()}`;

  const { error: updateError } = await db
    .from("users")
    .update({ avatar_url: versioned, updated_at: new Date().toISOString() } as never)
    .eq("id", opts.userId);

  if (updateError) throw updateError;
  return versioned;
}

export async function removeMemberAvatar(userId: string): Promise<void> {
  if (!isMemberAvatarsEnabled()) {
    throw new Error("avatars_unavailable");
  }

  const db = createServiceClient();
  const { data: row } = await db
    .from("users")
    .select("avatar_url")
    .eq("id", userId)
    .maybeSingle();

  const avatarUrl = (row as { avatar_url?: string | null } | null)?.avatar_url;
  if (avatarUrl) {
    for (const ext of ["jpg", "png", "webp"]) {
      await db.storage.from(MEMBER_AVATAR_BUCKET).remove([`${userId}/avatar.${ext}`]);
    }
  }

  const { error } = await db
    .from("users")
    .update({ avatar_url: null, updated_at: new Date().toISOString() } as never)
    .eq("id", userId);

  if (error) throw error;
}

export async function fetchUserAvatarUrl(userId: string): Promise<string | null> {
  if (isDemoMode()) return null;
  const db = createServiceClient();
  const { data, error } = await db
    .from("users")
    .select("avatar_url")
    .eq("id", userId)
    .maybeSingle();

  if (error) return null;
  return (data as { avatar_url?: string | null } | null)?.avatar_url ?? null;
}
