export function OverviewReturnHeroSkeleton() {
  return (
    <section
      className="pf-overview-return-hero overflow-hidden rounded-[var(--pf-radius-lg)] border border-[var(--pf-border)] shadow-[var(--pf-shadow-sm)] animate-pulse"
      aria-label="Loading your cumulative return"
      aria-busy
    >
      <div className="border-b border-[var(--pf-border)] px-4 py-4 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <div className="h-3 w-24 rounded bg-[var(--pf-gray-200)]" />
            <div className="h-4 w-40 rounded bg-[var(--pf-gray-100)]" />
            <div className="h-10 w-32 rounded-lg bg-[var(--pf-gray-200)] sm:h-12 sm:w-36" />
          </div>
          <div className="grid w-full grid-cols-3 gap-2 sm:max-w-[28rem] sm:grid-cols-5">
            {Array.from({ length: 5 }, (_, i) => (
              <div
                key={i}
                className="h-14 rounded-lg border border-[var(--pf-border)] bg-[var(--pf-gray-50)]/80 sm:h-16"
              />
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-3 px-3 pb-4 pt-4 sm:px-4">
        <div className="flex gap-2 px-1">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-8 w-10 rounded-md bg-[var(--pf-gray-100)]" />
          ))}
        </div>
        <div className="h-[300px] rounded-xl bg-[var(--pf-gray-100)]/80" />
      </div>
    </section>
  );
}
