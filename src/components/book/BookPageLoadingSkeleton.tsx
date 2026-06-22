function SkeletonBlock({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] bg-[var(--pf-gray-100)]/80 ${className}`}
    />
  );
}

export function BookChromeSkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonBlock className="h-20" />
      <SkeletonBlock className="h-12" />
    </div>
  );
}

export function BookBodySkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonBlock className="h-24" />
      <SkeletonBlock className="h-32" />
      <SkeletonBlock className="h-64" />
    </div>
  );
}
