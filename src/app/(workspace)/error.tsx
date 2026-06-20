"use client";

import { WorkspaceErrorFallback } from "@/components/errors/WorkspaceErrorFallback";

export default function WorkspaceSatelliteError({
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
      title="Page error"
      description="This workspace page failed to load. Try again or go back to overview."
    />
  );
}
