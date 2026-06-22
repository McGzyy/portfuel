import { WorkspaceLivePulse } from "@/components/dashboard/WorkspaceLivePulse";
import { ResearchContextRail } from "@/components/pro/ResearchContextRail";
import { ResearchSinceVisitBanner } from "@/components/pro/ResearchSinceVisitBanner";
import { ResearchVisitTracker } from "@/components/pro/ResearchVisitTracker";
import { WorkspaceContextShell } from "@/components/workspace/WorkspaceContextShell";
import type { ResearchHubTab } from "@/lib/dashboard/research-hub";

export function ResearchWorkspaceShell({
  children,
  tab,
  watchlistCount,
  userId,
  isPro,
  researchNewCount = 0,
}: {
  children: React.ReactNode;
  tab: ResearchHubTab;
  watchlistCount: number;
  userId: string;
  isPro: boolean;
  researchNewCount?: number;
}) {
  return (
    <WorkspaceContextShell
      pulseLabel="Research pulse"
      rail={<ResearchContextRail activeTab={tab} watchlistCount={watchlistCount} />}
      mainClassName="space-y-6 pb-14 lg:pb-0"
    >
      <ResearchVisitTracker />
      <WorkspaceLivePulse userId={userId} isPro={isPro} />
      {isPro && researchNewCount > 0 ? (
        <ResearchSinceVisitBanner count={researchNewCount} />
      ) : null}
      {children}
    </WorkspaceContextShell>
  );
}
