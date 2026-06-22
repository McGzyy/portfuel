import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ModerationBanner } from "@/components/member/ModerationBanner";
import { TwoFactorRecommendationBanner } from "@/components/auth/TwoFactorRecommendationBanner";
import { TwoFactorSecurityPrompt } from "@/components/auth/TwoFactorSecurityPrompt";
import { WorkspaceAnnouncementLoader } from "@/components/dashboard/WorkspaceAnnouncementLoader";
import { WorkspaceGuideLoader } from "@/components/dashboard/WorkspaceGuideLoader";
import { WorkspaceContent } from "@/components/dashboard/WorkspaceContent";
import {
  MemberNavSection,
  WorkspaceSidebarSection,
  EMPTY_ACTIVITY,
} from "@/components/dashboard/WorkspaceChromeSections";
import { WorkspaceShellProvider } from "@/components/dashboard/WorkspaceShellContext";
import {
  WorkspaceSearchHeaderTrigger,
  WorkspaceSearchShell,
} from "@/components/search/WorkspaceSearchShell";
import { toHeaderUser } from "@/lib/auth/session-user";
import type { SessionPayload } from "@/lib/auth/session-types";
import { LiveBookProvider } from "@/components/market/LiveBookProvider";
import { WorkspaceActivityProvider } from "@/components/workspace/WorkspaceActivityProvider";
import {
  canAccessProIntelligence,
  sessionToProContext,
} from "@/lib/features/pro-intelligence";

/** Shared workspace chrome — sidebar, mobile nav, search, and content shell. */
export function DashboardWorkspaceFrame({
  session,
  children,
}: {
  session: SessionPayload;
  children: React.ReactNode;
}) {
  const isPro = canAccessProIntelligence(sessionToProContext(session));
  const activityInitial = {
    ...EMPTY_ACTIVITY,
    at: new Date().toISOString(),
  };

  return (
    <WorkspaceShellProvider>
      <WorkspaceSearchShell>
        <AppShell
          user={toHeaderUser(session)}
          headerMode="workspace"
          headerCenter={<WorkspaceSearchHeaderTrigger />}
          workspaceAccount={{ avatarUrl: null, whatsNewUnread: 0 }}
          mainClassName="!max-w-none !px-0 !py-0"
        >
          <LiveBookProvider isPro={isPro}>
            <WorkspaceActivityProvider initial={activityInitial}>
              <div className="pf-workspace">
                <div className="pf-workspace-sidebar-wrap">
                  <WorkspaceSidebarSection session={session} />
                </div>
                <div className="pf-workspace-main">
                  <MemberNavSection session={session} />
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
                  <Suspense fallback={null}>
                    <WorkspaceAnnouncementLoader session={session} />
                  </Suspense>
                  <WorkspaceContent>{children}</WorkspaceContent>
                </div>
              </div>
            </WorkspaceActivityProvider>
          </LiveBookProvider>
          <Suspense fallback={null}>
            <WorkspaceGuideLoader
              userId={session.userId}
              username={session.username}
              role={session.role}
            />
          </Suspense>
          <TwoFactorSecurityPrompt
            userId={session.userId}
            totpVerified={session.totpVerified}
            isAdmin={session.role === "admin"}
          />
        </AppShell>
      </WorkspaceSearchShell>
    </WorkspaceShellProvider>
  );
}
