"use client";

import { useOverviewLayoutOptional } from "@/components/dashboard/OverviewLayoutProvider";
import type { OverviewPanelId } from "@/lib/workspace/overview-layout";

export function OverviewPanelGate({
  panelId,
  children,
}: {
  panelId: OverviewPanelId;
  children: React.ReactNode;
}) {
  const layout = useOverviewLayoutOptional();
  if (layout && !layout.isPanelVisible(panelId)) return null;
  return <>{children}</>;
}
