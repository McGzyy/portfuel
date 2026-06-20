"use client";

import { WorkspaceErrorFallback } from "@/components/errors/WorkspaceErrorFallback";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <WorkspaceErrorFallback
      error={error}
      reset={reset}
      title="Workspace page error"
      description="This dashboard page failed to load. Try again or return to overview while we keep the rest of your workspace available."
    />
  );
}
