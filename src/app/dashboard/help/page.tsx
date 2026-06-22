import type { Metadata } from "next";
import { HelpWorkspace } from "@/components/help/HelpWorkspace";
import { HelpContextRail } from "@/components/help/HelpContextRail";
import { WorkspaceLivePulse } from "@/components/dashboard/WorkspaceLivePulse";
import { WorkspaceContextShell } from "@/components/workspace/WorkspaceContextShell";
import { requireDashboardSession } from "@/lib/dashboard/data";
import { parseHelpSection } from "@/lib/help/content";
import {
  isProIntelligenceLocked,
  sessionToProContext,
} from "@/lib/features/pro-intelligence";

export const metadata: Metadata = {
  title: "Help & support",
};

export default async function DashboardHelpPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string; view?: string; ticket?: string }>;
}) {
  const session = await requireDashboardSession();
  const proLocked = isProIntelligenceLocked(sessionToProContext(session));
  const params = await searchParams;
  const sectionId = parseHelpSection(params.section);
  const ticketsView = params.view === "tickets" || Boolean(params.ticket);

  return (
    <WorkspaceContextShell
      pulseLabel="Help pulse"
      rail={<HelpContextRail />}
      mainClassName="pb-14 lg:pb-0"
    >
      <WorkspaceLivePulse userId={session.userId} isPro={!proLocked} />
      <HelpWorkspace sectionId={sectionId} ticketsView={ticketsView} />
    </WorkspaceContextShell>
  );
}
