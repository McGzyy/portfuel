export function TickerPageSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="pf-card-elevated p-6">
        <div className="h-4 w-24 rounded bg-[var(--pf-gray-200)]" />
        <div className="mt-4 h-9 w-40 rounded bg-[var(--pf-gray-200)]" />
        <div className="mt-2 h-4 w-56 rounded bg-[var(--pf-gray-100)]" />
        <div className="mt-6 h-[380px] rounded-[var(--pf-radius-lg)] bg-[var(--pf-gray-100)]" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-48 rounded-[var(--pf-radius-lg)] bg-[var(--pf-gray-100)]" />
        <div className="h-48 rounded-[var(--pf-radius-lg)] bg-[var(--pf-gray-100)]" />
      </div>
    </div>
  );
}
