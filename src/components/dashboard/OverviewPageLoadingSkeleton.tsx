import { OverviewReturnHeroSkeleton } from "@/components/dashboard/OverviewReturnHeroSkeleton";

function SkeletonBlock({ className }: { className: string }) {
  return (
    <div
      className={`rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-[var(--pf-gray-100)]/80 ${className}`}
    />
  );
}

export function OverviewPageLoadingSkeleton() {
  return (
    <div className="pf-workspace-content animate-pulse space-y-4 sm:space-y-6">
      <SkeletonBlock className="h-16 sm:h-20" />
      <OverviewReturnHeroSkeleton />
      <SkeletonBlock className="h-40" />
      <SkeletonBlock className="h-40" />
      <SkeletonBlock className="h-72" />
    </div>
  );
}
