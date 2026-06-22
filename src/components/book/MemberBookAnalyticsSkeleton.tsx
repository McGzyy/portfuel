export function MemberBookAnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <section className="pf-workspace-panel overflow-hidden">
        <div className="border-b border-[var(--pf-border)] px-5 py-4">
          <div className="h-3 w-28 rounded bg-[var(--pf-gray-200)]" />
          <div className="mt-2 h-4 w-48 rounded bg-[var(--pf-gray-100)]" />
          <div className="mt-2 h-3 w-64 max-w-full rounded bg-[var(--pf-gray-100)]" />
        </div>
        <div className="space-y-4 p-2 sm:p-3">
          <div className="h-[180px] rounded-[var(--pf-radius)] bg-[var(--pf-gray-100)]/80" />
          <div className="grid gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => (
              <div
                key={i}
                className="h-[4.5rem] rounded-[var(--pf-radius)] border border-[var(--pf-border)] bg-[var(--pf-gray-50)]"
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
