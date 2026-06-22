import { MemberBookAnalyticsSkeleton } from "@/components/book/MemberBookAnalyticsSkeleton";

export default function DashboardBookLoading() {
  return (
    <div className="space-y-6 animate-pulse pb-14 lg:pb-0">
      <div className="h-20 rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-[var(--pf-gray-100)]/80" />
      <div className="h-24 rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-[var(--pf-gray-100)]/80" />
      <MemberBookAnalyticsSkeleton />
      <div className="h-64 rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-[var(--pf-gray-100)]/80" />
    </div>
  );
}
