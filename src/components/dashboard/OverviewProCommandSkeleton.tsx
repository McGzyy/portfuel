export function OverviewProCommandSkeleton() {
  return (
    <section
      className="animate-pulse overflow-hidden rounded-[var(--pf-radius-lg)] border border-sky-500/25 bg-gradient-to-br from-sky-950/90 via-[#0a0a0a] to-slate-950 shadow-[var(--pf-shadow-lg)]"
      aria-label="Loading Pro command center"
      aria-busy
    >
      <div className="border-b border-white/10 px-5 py-4 sm:px-6">
        <div className="h-3 w-32 rounded bg-white/10" />
        <div className="mt-2 h-5 w-48 rounded bg-white/10" />
      </div>
      <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
        <div className="h-40 rounded-xl bg-white/5" />
        <div className="h-40 rounded-xl bg-white/5" />
      </div>
      <div className="border-t border-white/10 px-5 py-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-16 rounded-lg bg-white/5" />
          ))}
        </div>
      </div>
    </section>
  );
}
