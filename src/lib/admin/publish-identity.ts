import { createServiceClient } from "@/lib/db/supabase";
import type { SessionPayload } from "@/lib/auth/session-types";

export type PublishIdentityOption = {
  userId: string;
  username: string;
  displayName: string | null;
  kind: "desk" | "personal";
  label: string;
};

function personalUsernameFromEnv(): string | null {
  const raw = process.env.ADMIN_PERSONAL_USERNAME?.trim().toLowerCase();
  return raw || null;
}

export async function fetchAdminPublishIdentities(
  authUserId: string
): Promise<PublishIdentityOption[]> {
  const db = createServiceClient();
  const { data: deskUser } = await db
    .from("users")
    .select("id, username, display_name, role")
    .eq("id", authUserId)
    .maybeSingle();

  if (!deskUser || (deskUser as { role: string }).role !== "admin") {
    return [];
  }

  const desk = deskUser as {
    id: string;
    username: string;
    display_name: string | null;
  };

  const out: PublishIdentityOption[] = [
    {
      userId: desk.id,
      username: desk.username,
      displayName: desk.display_name,
      kind: "desk",
      label: "PortFuel desk (Fueled)",
    },
  ];

  const personalUsername = personalUsernameFromEnv();
  if (!personalUsername) return out;

  const { data: personal } = await db
    .from("users")
    .select("id, username, display_name, role")
    .ilike("username", personalUsername)
    .maybeSingle();

  if (!personal) return out;
  const p = personal as { id: string; username: string; display_name: string | null; role: string };
  if (p.id === desk.id || p.role === "admin") return out;

  out.push({
    userId: p.id,
    username: p.username,
    displayName: p.display_name,
    kind: "personal",
    label: `@${p.username} (personal)`,
  });

  return out;
}

export async function isAllowedPublishIdentity(
  authUserId: string,
  targetUserId: string
): Promise<boolean> {
  if (authUserId === targetUserId) return true;
  const options = await fetchAdminPublishIdentities(authUserId);
  return options.some((o) => o.userId === targetUserId);
}

export function isDeskPublishIdentity(session: SessionPayload): boolean {
  const authUserId = session.authUserId ?? session.userId;
  return session.role === "admin" && session.userId === authUserId;
}

export function authUserIdFromSession(session: SessionPayload): string {
  return session.authUserId ?? session.userId;
}
