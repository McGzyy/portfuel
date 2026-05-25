export function AdminDailyChart({
  title,
  subtitle,
  series,
}: {
  title: string;
  subtitle?: string;
  series: { date: string; count: number }[];
}) {
  const max = Math.max(...series.map((s) => s.count), 1);

  return (
    <div className="pf-workspace-panel p-5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pf-gray-400)]">
        {title}
      </p>
      {subtitle ? <p className="mt-1 text-xs text-[var(--pf-gray-500)]">{subtitle}</p> : null}
      {series.every((s) => s.count === 0) ? (
        <p className="mt-4 text-sm text-[var(--pf-gray-500)]">No activity in this window.</p>
      ) : (
        <div className="mt-5 flex items-end gap-1" style={{ height: 120 }}>
          {series.map((s) => {
            const h = Math.max(4, (s.count / max) * 100);
            const label = s.date.slice(5);
            return (
              <div
                key={s.date}
                className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1"
                title={`${s.date}: ${s.count}`}
              >
                <span className="text-[9px] font-semibold tabular-nums text-[var(--pf-gray-500)]">
                  {s.count > 0 ? s.count : ""}
                </span>
                <div
                  className="w-full max-w-[20px] rounded-t bg-[var(--pf-red)]/80"
                  style={{ height: `${h}%` }}
                />
                <span className="text-[8px] text-[var(--pf-gray-400)]">{label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
