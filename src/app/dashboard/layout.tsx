import { AppShell } from "@/components/layout/AppShell";
import { MemberNav } from "@/components/dashboard/MemberNav";
import { ModerationBanner } from "@/components/member/ModerationBanner";
import { WorkspaceAnnouncementStack } from "@/components/announcements/WorkspaceAnnouncementStack";
import { fetchActiveAnnouncementsForUser } from "@/lib/announcements/service";
import { WorkspaceSidebar } from "@/components/dashboard/WorkspaceSidebar";
import { WorkspaceContent } from "@/components/dashboard/WorkspaceContent";
import { WorkspaceGuide } from "@/components/dashboard/WorkspaceGuide";
import {
  WorkspaceSearchHeaderTrigger,
  WorkspaceSearchShell,
} from "@/components/search/WorkspaceSearchShell";
import { requireDashboardSession } from "@/lib/dashboard/data";
import { shouldAutoShowWorkspaceGuide } from "@/lib/onboarding/workspace-guide";
import { toHeaderUser } from "@/lib/auth/session-user";
import { countUnreadDmThreads } from "@/lib/messages/service";
import { fetchUnreadCount } from "@/lib/notifications/service";
import { workspaceMetadata } from "@/lib/seo/site";

export const metadata = workspaceMetadata;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireDashboardSession();

  const [unreadPair, announcements, showWorkspaceGuide] = await Promise.all([
    Promise.all([
      countUnreadDmThreads(session.userId),
      fetchUnreadCount(session.userId),
    ]).catch(() => [0, 0] as const),
    fetchActiveAnnouncementsForUser(session.userId, session).catch(() => []),
    shouldAutoShowWorkspaceGuide(session.userId, session.role).catch(() => false),
  ]);
  const [dmUnread, notifUnread] = unreadPair;

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
              isAdmin={session.role === "admin"}
              dmUnread={dmUnread}
              notifUnread={notifUnread}
            />
          </div>
          <div className="pf-workspace-main">
            <MemberNav
              dmUnread={dmUnread}
              notifUnread={notifUnread}
              username={session.username}
              displayName={session.displayName ?? session.username}
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
