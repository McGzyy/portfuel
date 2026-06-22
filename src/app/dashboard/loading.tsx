import { OverviewReturnHeroSkeleton } from "@/components/dashboard/OverviewReturnHeroSkeleton";

export default function DashboardLoading() {
  return (
    <div className="pf-workspace-content animate-pulse space-y-4 sm:space-y-6">
      <div className="h-16 rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-[var(--pf-gray-100)]/80 sm:h-20" />
      <OverviewReturnHeroSkeleton />
      <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="h-[4.5rem] rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-[var(--pf-gray-100)]/80"
          />
        ))}
      </div>
      <div className="h-40 rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-[var(--pf-gray-100)]/80" />
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="h-56 rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-[var(--pf-gray-100)]/80 lg:col-span-7" />
        <div className="h-48 rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-[var(--pf-gray-100)]/80 lg:col-span-5" />
      </div>
    </div>
  );
}
