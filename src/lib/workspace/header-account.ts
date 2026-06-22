import { cache } from "react";
import type { SessionPayload } from "@/lib/auth/session-types";
import { countUnreadWhatsNew, fetchChangelogForUser } from "@/lib/announcements/changelog";
import { fetchUserAvatarUrl } from "@/lib/users/member-avatar";

export type WorkspaceHeaderAccount = {
  avatarUrl: string | null;
  whatsNewUnread: number;
};

export async function fetchWorkspaceHeaderAccount(
  session: SessionPayload
): Promise<WorkspaceHeaderAccount> {
  const [avatarUrl, changelog] = await Promise.all([
    fetchUserAvatarUrl(session.userId).catch(() => null),
    fetchChangelogForUser(session.userId, session).catch(() => []),
  ]);
  return {
    avatarUrl,
    whatsNewUnread: countUnreadWhatsNew(changelog),
  };
}

/** Deduped per-request header account + what's-new counts for workspace chrome. */
export const loadWorkspaceHeaderAccount = cache(fetchWorkspaceHeaderAccount);
