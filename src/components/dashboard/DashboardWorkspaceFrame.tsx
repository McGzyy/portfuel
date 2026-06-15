import { AppShell } from "@/components/layout/AppShell";
import { MemberNav } from "@/components/dashboard/MemberNav";
import { ModerationBanner } from "@/components/member/ModerationBanner";
import { WorkspaceAnnouncementStack } from "@/components/announcements/WorkspaceAnnouncementStack";
import { fetchActiveAnnouncementsForUser } from "@/lib/announcements/service";
import { countUnreadWhatsNew, fetchChangelogForUser } from "@/lib/announcements/changelog";
import { WorkspaceSidebar } from "@/components/dashboard/WorkspaceSidebar";
import { WorkspaceContent } from "@/components/dashboard/WorkspaceContent";
import { WorkspaceGuide } from "@/components/dashboard/WorkspaceGuide";
import {
  WorkspaceSearchHeaderTrigger,
  WorkspaceSearchShell,
} from "@/components/search/WorkspaceSearchShell";
import { shouldAutoShowWorkspaceGuide } from "@/lib/onboarding/workspace-guide";
import { toHeaderUser } from "@/lib/auth/session-user";
import type { SessionPayload } from "@/lib/auth/session-types";
import { countUnreadDmThreads } from "@/lib/messages/service";
import { fetchUnreadCount } from "@/lib/notifications/service";
import { fetchUserAvatarUrl } from "@/lib/users/member-avatar";

/** Shared workspace chrome — sidebar, mobile nav, search, and content shell. */
export async function DashboardWorkspaceFrame({
  session,
  children,
}: {
  session: SessionPayload;
  children: React.ReactNode;
}) {
  const [unreadPair, announcements, changelog, showWorkspaceGuide, avatarUrl] =
    await Promise.all([
      Promise.all([
        countUnreadDmThreads(session.userId),
        fetchUnreadCount(session.userId),
      ]).catch(() => [0, 0] as const),
      fetchActiveAnnouncementsForUser(session.userId, session).catch(() => []),
      fetchChangelogForUser(session.userId, session).catch(() => []),
      shouldAutoShowWorkspaceGuide(session.userId, session.role).catch(() => false),
      fetchUserAvatarUrl(session.userId).catch(() => null),
    ]);
  const [dmUnread, notifUnread] = unreadPair;
  const whatsNewUnread = countUnreadWhatsNew(changelog);

  return (
    <WorkspaceSearchShell>
      <AppShell
        user={toHeaderUser(session)}
        headerMode="workspace"
        headerCenter={<WorkspaceSearchHeaderTrigger />}
        mainClassName="!max-w-none !px-0 !py-0"
      >
        <div className="pf-workspace">
          <div className="pf-workspace-sidebar-wrap">
            <WorkspaceSidebar
              username={session.username}
              displayName={session.displayName ?? session.username}
              avatarUrl={avatarUrl}
              isAdmin={session.role === "admin"}
              dmUnread={dmUnread}
              notifUnread={notifUnread}
              whatsNewUnread={whatsNewUnread}
            />
          </div>
          <div className="pf-workspace-main">
            <MemberNav
              dmUnread={dmUnread}
              notifUnread={notifUnread}
              whatsNewUnread={whatsNewUnread}
              username={session.username}
              displayName={session.displayName ?? session.username}
              avatarUrl={avatarUrl}
              isAdmin={session.role === "admin"}
            />
            <ModerationBanner
              role={session.role}
              canPublishCalls={session.canPublishCalls}
              canDm={session.canDm}
              canComment={session.canComment}
            />
            {announcements.length > 0 ? (
              <WorkspaceAnnouncementStack announcements={announcements} />
            ) : null}
            <WorkspaceContent>{children}</WorkspaceContent>
          </div>
        </div>
        <WorkspaceGuide
          username={session.username}
          userId={session.userId}
          autoShow={showWorkspaceGuide}
        />
      </AppShell>
    </WorkspaceSearchShell>
  );
}
