"use client";

import { useOverviewLayout } from "@/components/dashboard/OverviewLayoutProvider";
import { cn } from "@/lib/utils";

export function OverviewLayoutBody({ children }: { children: React.ReactNode }) {
  const { densityClass } = useOverviewLayout();
  return <div className={cn(densityClass, "pb-14 lg:pb-0")}>{children}</div>;
}
