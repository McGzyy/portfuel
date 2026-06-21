"use client";

import { useOverviewLayout } from "@/components/dashboard/OverviewLayoutProvider";
import { WorkspaceContextShell } from "@/components/workspace/WorkspaceContextShell";
import { cn } from "@/lib/utils";

export function OverviewLayoutBody({
  children,
  rail,
}: {
  children: React.ReactNode;
  rail?: React.ReactNode;
}) {
  const { densityClass } = useOverviewLayout();

  return (
    <WorkspaceContextShell
      rail={rail}
      mainClassName={cn(densityClass, "pb-14 lg:pb-0")}
    >
      {children}
    </WorkspaceContextShell>
  );
}
