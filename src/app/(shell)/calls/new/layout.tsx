import { Suspense } from "react";
import { WorkspacePageSkeleton } from "@/components/dashboard/WorkspacePageSkeleton";

export default function NewCallLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<WorkspacePageSkeleton blocks={2} wide />}>{children}</Suspense>
  );
}
