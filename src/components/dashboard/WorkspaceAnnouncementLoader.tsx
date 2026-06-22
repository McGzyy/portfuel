import { WorkspaceAnnouncementStack } from "@/components/announcements/WorkspaceAnnouncementStack";
import { fetchActiveAnnouncementsForUser } from "@/lib/announcements/service";
import type { SessionPayload } from "@/lib/auth/session-types";

export async function WorkspaceAnnouncementLoader({ session }: { session: SessionPayload }) {
  const announcements = await fetchActiveAnnouncementsForUser(session.userId, session).catch(
    () => []
  );
  if (announcements.length === 0) return null;
  return <WorkspaceAnnouncementStack announcements={announcements} />;
}
