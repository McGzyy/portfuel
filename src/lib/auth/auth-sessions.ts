import { createServiceClient } from "@/lib/db/supabase";
import { isDemoMode } from "@/lib/demo/config";
import { clientLabelFromUserAgent, ipHintFromAddress } from "@/lib/auth/client-label";

export type AuthSessionListItem = {
  id: string;
  clientLabel: string;
  ipHint: string | null;
  createdAt: string;
  lastSeenAt: string;
  isCurrent: boolean;
};

export async function fetchUserSessionVersion(userId: string): Promise<number> {
  if (isDemoMode()) return 0;

  const db = createServiceClient();
  const { data } = await db
    .from("users")
    .select("session_version")
    .eq("id", userId)
    .maybeSingle();

  return (data as { session_version?: number } | null)?.session_version ?? 0;
}

export async function createAuthSession(opts: {
  userId: string;
  userAgent?: string;
  ip?: string;
}): Promise<{ sessionId: string; sessionVersion: number }> {
  if (isDemoMode()) {
    return { sessionId: "demo", sessionVersion: 0 };
  }

  const db = createServiceClient();
  const sessionVersion = await fetchUserSessionVersion(opts.userId);

  const { data, error } = await db
    .from("user_auth_sessions")
    .insert({
      user_id: opts.userId,
      client_label: clientLabelFromUserAgent(opts.userAgent),
      user_agent: opts.userAgent?.slice(0, 512) ?? null,
      ip_hint: ipHintFromAddress(opts.ip),
    } as never)
    .select("id")
    .single();

  if (error) throw error;

  return {
    sessionId: (data as { id: string }).id,
    sessionVersion,
  };
}

export async function isAuthSessionValid(opts: {
  userId: string;
  sessionId?: string;
  sessionVersion?: number;
}): Promise<boolean> {
  if (isDemoMode()) return true;

  const dbVersion = await fetchUserSessionVersion(opts.userId);
  const jwtVersion = opts.sessionVersion ?? 0;
  if (jwtVersion !== dbVersion) return false;

  if (!opts.sessionId) return true;

  const db = createServiceClient();
  const { data } = await db
    .from("user_auth_sessions")
    .select("revoked_at")
    .eq("id", opts.sessionId)
    .eq("user_id", opts.userId)
    .maybeSingle();

  if (!data) return false;
  return !(data as { revoked_at: string | null }).revoked_at;
}

export async function touchAuthSession(sessionId: string): Promise<void> {
  if (isDemoMode() || !sessionId || sessionId === "demo") return;

  try {
    const db = createServiceClient();
    const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    await db
      .from("user_auth_sessions")
      .update({ last_seen_at: new Date().toISOString() } as never)
      .eq("id", sessionId)
      .is("revoked_at", null)
      .or(`last_seen_at.is.null,last_seen_at.lt.${cutoff}`);
  } catch {
    /* best effort */
  }
}

export async function listAuthSessions(
  userId: string,
  currentSessionId?: string
): Promise<AuthSessionListItem[]> {
  if (isDemoMode()) {
    return [
      {
        id: "demo",
        clientLabel: "This device",
        ipHint: null,
        createdAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        isCurrent: true,
      },
    ];
  }

  const db = createServiceClient();
  const { data } = await db
    .from("user_auth_sessions")
    .select("id, client_label, ip_hint, created_at, last_seen_at")
    .eq("user_id", userId)
    .is("revoked_at", null)
    .order("last_seen_at", { ascending: false })
    .limit(20);

  return ((data ?? []) as {
    id: string;
    client_label: string;
    ip_hint: string | null;
    created_at: string;
    last_seen_at: string;
  }[]).map((row) => ({
    id: row.id,
    clientLabel: row.client_label,
    ipHint: row.ip_hint,
    createdAt: row.created_at,
    lastSeenAt: row.last_seen_at,
    isCurrent: Boolean(currentSessionId && row.id === currentSessionId),
  }));
}

export async function revokeAuthSession(sessionId: string, userId: string): Promise<void> {
  if (isDemoMode()) return;

  const db = createServiceClient();
  const now = new Date().toISOString();
  const { error } = await db
    .from("user_auth_sessions")
    .update({ revoked_at: now } as never)
    .eq("id", sessionId)
    .eq("user_id", userId)
    .is("revoked_at", null);
  if (error) throw error;
}

export async function revokeAllAuthSessions(userId: string): Promise<number> {
  if (isDemoMode()) return 0;

  const db = createServiceClient();
  const now = new Date().toISOString();

  const version = await fetchUserSessionVersion(userId);
  const nextVersion = version + 1;

  const { error: versionError } = await db
    .from("users")
    .update({ session_version: nextVersion } as never)
    .eq("id", userId);
  if (versionError) throw versionError;

  const { data, error } = await db
    .from("user_auth_sessions")
    .update({ revoked_at: now } as never)
    .eq("user_id", userId)
    .is("revoked_at", null)
    .select("id");
  if (error) throw error;

  return (data ?? []).length;
}
