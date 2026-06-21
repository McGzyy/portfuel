"use client";

import { useOverviewLayout } from "@/components/dashboard/OverviewLayoutProvider";
import { cn } from "@/lib/utils";

export function OverviewLayoutBody({
  children,
  rail,
}: {
  children: React.ReactNode;
  rail?: React.ReactNode;
}) {
  const { densityClass } = useOverviewLayout();

  if (!rail) {
    return <div className={cn(densityClass, "pb-14 lg:pb-0")}>{children}</div>;
  }

  return (
    <div className="pf-workspace-overview-shell">
      <div className={cn("pf-workspace-overview-main min-w-0", densityClass, "pb-14 lg:pb-0")}>
        {children}
      </div>
      {rail}
    </div>
  );
}
