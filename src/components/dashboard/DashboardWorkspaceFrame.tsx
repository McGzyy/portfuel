import { cookies } from "next/headers";
import { AppShell } from "@/components/layout/AppShell";
import { MemberNav } from "@/components/dashboard/MemberNav";
import { ModerationBanner } from "@/components/member/ModerationBanner";
import { TwoFactorRecommendationBanner } from "@/components/auth/TwoFactorRecommendationBanner";
import { TwoFactorSecurityPrompt } from "@/components/auth/TwoFactorSecurityPrompt";
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
import { LiveBookProvider } from "@/components/market/LiveBookProvider";
import { WorkspaceActivityProvider } from "@/components/workspace/WorkspaceActivityProvider";
import { countFeedCallsSince } from "@/lib/feed/new-count";
import { FEED_SEEN_COOKIE, parseFeedSeenAt } from "@/lib/feed/last-seen";
import {
  canAccessProIntelligence,
  sessionToProContext,
} from "@/lib/features/pro-intelligence";

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
  const isPro = canAccessProIntelligence(sessionToProContext(session));
  const cookieStore = await cookies();
  const feedSeenAt = parseFeedSeenAt(cookieStore.get(FEED_SEEN_COOKIE)?.value);
  const feedNewCount = await countFeedCallsSince(feedSeenAt).catch(() => 0);
  const activityInitial = {
    notifUnread,
    dmUnread,
    feedNewCount,
    at: new Date().toISOString(),
  };

  return (
    <WorkspaceSearchShell>
      <AppShell
        user={toHeaderUser(session)}
        headerMode="workspace"
        headerCenter={<WorkspaceSearchHeaderTrigger />}
        mainClassName="!max-w-none !px-0 !py-0"
      >
        <LiveBookProvider isPro={isPro}>
        <WorkspaceActivityProvider initial={activityInitial}>
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
            <TwoFactorRecommendationBanner
              userId={session.userId}
              totpVerified={session.totpVerified}
              isAdmin={session.role === "admin"}
            />
            {announcements.length > 0 ? (
              <WorkspaceAnnouncementStack announcements={announcements} />
            ) : null}
            <WorkspaceContent>{children}</WorkspaceContent>
          </div>
        </div>
        </WorkspaceActivityProvider>
        </LiveBookProvider>
        <WorkspaceGuide
          username={session.username}
          userId={session.userId}
          autoShow={showWorkspaceGuide}
        />
        <TwoFactorSecurityPrompt
          userId={session.userId}
          totpVerified={session.totpVerified}
          isAdmin={session.role === "admin"}
        />
      </AppShell>
    </WorkspaceSearchShell>
  );
}
