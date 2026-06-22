function SkeletonBlock({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-[var(--pf-gray-100)]/80 ${className}`}
    />
  );
}

export function FeedChromeSkeleton() {
  return (
    <div className="animate-pulse space-y-4 sm:space-y-6">
      <SkeletonBlock className="h-16 sm:h-20" />
      <SkeletonBlock className="h-10" />
      <SkeletonBlock className="h-12" />
    </div>
  );
}

export function FeedBodySkeleton() {
  return (
    <div className="pf-feed-body animate-pulse space-y-4 sm:space-y-6">
      <SkeletonBlock className="h-48" />
      <SkeletonBlock className="h-14" />
      <SkeletonBlock className="h-40" />
      <SkeletonBlock className="h-72 wide" />
    </div>
  );
}
