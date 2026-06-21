import { cn } from "@/lib/utils";

function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gradient-to-r from-[var(--pf-gray-100)] via-[var(--pf-gray-50)] to-[var(--pf-gray-100)]",
        className
      )}
    />
  );
}

export function DiscoveryQueueSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <Shimmer className="h-11 w-full rounded-[var(--pf-radius-lg)]" />
      <div className="overflow-hidden rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-white">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 border-b border-[var(--pf-border)] px-4 py-3 last:border-b-0"
          >
            <Shimmer className="h-5 w-14" />
            <Shimmer className="h-4 w-8" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Shimmer className="h-3 w-4/5 max-w-xs" />
              <Shimmer className="h-2.5 w-2/5 max-w-[8rem]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DiscoveryWorkboardSkeleton() {
  return (
    <div className="pf-discovery-workboard hidden lg:grid">
      <div className="pf-discovery-workboard-toolbar space-y-3">
        <Shimmer className="h-11 w-full rounded-[var(--pf-radius-lg)]" />
      </div>
      <DiscoveryQueueSkeleton rows={8} />
      <div className="pf-workspace-panel space-y-3 p-5">
        <Shimmer className="h-6 w-24" />
        <Shimmer className="h-4 w-full max-w-md" />
        <Shimmer className="mt-4 h-24 w-full" />
        <Shimmer className="h-10 w-full" />
      </div>
      <div className="pf-discovery-rail-host space-y-3 border-l border-[var(--pf-border)] pl-4">
        <Shimmer className="h-36 w-full rounded-[var(--pf-radius-lg)]" />
        <Shimmer className="h-48 w-full rounded-[var(--pf-radius-lg)]" />
      </div>
    </div>
  );
}
