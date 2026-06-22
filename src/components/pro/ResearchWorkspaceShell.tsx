import { WorkspaceLivePulse } from "@/components/dashboard/WorkspaceLivePulse";
import { ResearchContextRail } from "@/components/pro/ResearchContextRail";
import { WorkspaceContextShell } from "@/components/workspace/WorkspaceContextShell";
import type { ResearchHubTab } from "@/lib/dashboard/research-hub";

export function ResearchWorkspaceShell({
  children,
  tab,
  watchlistCount,
  userId,
  isPro,
}: {
  children: React.ReactNode;
  tab: ResearchHubTab;
  watchlistCount: number;
  userId: string;
  isPro: boolean;
}) {
  return (
    <WorkspaceContextShell
      pulseLabel="Research pulse"
      rail={<ResearchContextRail activeTab={tab} watchlistCount={watchlistCount} />}
      mainClassName="space-y-6 pb-14 lg:pb-0"
    >
      <WorkspaceLivePulse userId={userId} isPro={isPro} />
      {children}
    </WorkspaceContextShell>
  );
}
